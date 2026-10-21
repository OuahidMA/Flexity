/**
 * Gym-admin routes: dashboard overview and tenant member management.
 *
 * Coaches and clients are embedded subdocuments on the gym admin User document,
 * so all member reads/writes load that single admin via getGymAdmin(gymId).
 * This module is the authoritative place where members are created, edited,
 * deactivated, and removed.
 *
 * Security/data-flow notes:
 * - The whole router requires gym_admin; every lookup is further scoped to the
 *   admin's own gymId.
 * - Changing a member's password/email, or deactivating them, bumps their
 *   sessionVersion so existing tokens fail checkAccess.
 * - Deleting a coach also detaches their clients, removes routine mirrors from
 *   those clients, and deletes the coach's routines.
 * - Coach assignment is a coach-side action: admins create unassigned clients
 *   and this router never writes `coachId`/`coach` on a client.
 */

import { Router } from "express";
import mongoose from "mongoose";
import Routine from "../models/Routine.js";
import auth from "../middleware/auth.js";
import checkAccess from "../middleware/checkAccess.js";
import requireRole from "../middleware/requireRole.js";
import { normalizeEmail } from "../utils/session.js";
import {
  findAccountByEmail,
  findMember,
  getGymAdmin,
} from "../utils/members.js";
import {
  formatPin,
  generateAccessPin,
  isValidPin,
  normalizePin,
  pinInUse,
} from "../utils/pins.js";

const router = Router();

// All endpoints require a gym_admin with a valid subscription for this tenant.
router.use(auth, checkAccess, requireRole("gym_admin"));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Shapes an embedded client (or recent member) for admin-facing responses.
 *
 * @param {object} user Embedded client subdocument.
 * @param {Map<string, string>} coachNames Coach id -> display name.
 * @returns {object} Serialized member.
 */
function serializeMember(user, coachNames) {
  return {
    id: String(user._id),
    name: user.profile?.name || "",
    email: user.email || "",
    active: user.profile?.isActive !== false,
    // PIN is exposed to the admin so it can be shared; setupRequired flips to
    // false after the member redeems it.
    pin: user.claimPin || "",
    setupRequired: Boolean(user.claimPin),
    coachId: user.coachId ? String(user.coachId) : null,
    coachName: user.coachId
      ? coachNames.get(String(user.coachId)) ?? ""
      : "",
    coach: user.coach || "",
    workoutRoutines: (user.workoutRoutines ?? []).map((routine) => ({
      routineId: routine.routineId,
      name: routine.name,
    })),
    joinedAt: user.createdAt,
  };
}

/**
 * Shapes an embedded coach for admin-facing responses, including how many
 * clients currently reference it.
 *
 * @param {object} user Embedded coach subdocument.
 * @param {Map<string, number>} clientCounts Coach id -> client count.
 * @returns {object} Serialized coach.
 */
function serializeCoach(user, clientCounts) {
  return {
    id: String(user._id),
    name: user.profile?.name || "",
    email: user.email || "",
    speciality: user.profile?.speciality || "",
    active: user.profile?.isActive !== false,
    pin: user.claimPin || "",
    setupRequired: Boolean(user.claimPin),
    clients: clientCounts.get(String(user._id)) ?? 0,
    joinedAt: user.createdAt,
  };
}

/**
 * Builds a coach id -> assigned-client count map in one pass over the admin's
 * clients (clients with no coach are ignored).
 *
 * @param {object} admin Gym admin document.
 * @returns {Map<string, number>}
 */
function coachClientCounts(admin) {
  const counts = new Map();

  for (const client of admin.clients) {
    if (!client.coachId) continue;

    const key = String(client.coachId);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

/**
 * Builds a coach id -> display-name map for serializing client assignments.
 *
 * @param {object} admin Gym admin document.
 * @returns {Map<string, string>}
 */
function coachNameMap(admin) {
  return new Map(
    admin.coaches.map((coach) => [
      String(coach._id),
      coach.profile?.name || coach.email,
    ])
  );
}

/**
 * Resolves the setup PIN for a new member. Admins normally generate a PIN in the
 * dialog; when the body omits one, a unique PIN is generated server-side.
 *
 * @param {unknown} rawPin
 * @returns {Promise<{pin?: string, error?: string, status?: number}>}
 */
async function resolveSetupPin(rawPin) {
  if (rawPin === undefined || String(rawPin).trim() === "") {
    return { pin: await generateAccessPin() };
  }

  const pin = normalizePin(rawPin);

  if (!isValidPin(pin)) {
    return { error: "Enter a valid 8-character PIN.", status: 400 };
  }

  if (await pinInUse(pin)) {
    return {
      error: "That PIN is already in use. Generate a new one.",
      status: 409,
    };
  }

  return { pin };
}

/**
 * Checks for an email collision across both top-level users and embedded
 * members. `ignoreId` allows the account being edited to keep its own email.
 *
 * @param {string} email Normalized email.
 * @param {unknown} [ignoreId] Member id to exclude from the check.
 * @returns {Promise<boolean>}
 */
async function emailAlreadyExists(email, ignoreId = null) {
  const existing = await findAccountByEmail(email);

  if (!existing) return false;
  if (ignoreId && String(existing.user._id) === String(ignoreId)) {
    return false;
  }

  return true;
}

/**
 * Returns a sorted copy (never mutates the Mongoose array).
 *
 * @param {Array<object>} members
 * @param {1|-1} direction 1 = oldest first, -1 = newest first.
 * @returns {Array<object>}
 */
function sortByCreatedAt(members, direction) {
  return [...members].sort(
    (first, second) =>
      direction *
      (new Date(first.createdAt).getTime() -
        new Date(second.createdAt).getTime())
  );
}

// ---------------------------------------------------------------------------
// GET /api/gym/overview - dashboard summary
// ---------------------------------------------------------------------------
router.get("/overview", async (req, res, next) => {
  try {
    const gymId = req.user.gymId;
    const admin = await getGymAdmin(gymId);

    const routines = await Routine.countDocuments({ gymId });
    // `recent` intentionally returns only a small slice; the full list is
    // available from /clients.
    const coachList = sortByCreatedAt(admin.coaches, 1);
    const recent = sortByCreatedAt(admin.clients, -1).slice(0, 6);
    const counts = coachClientCounts(admin);
    const coachNames = coachNameMap(admin);

    return res.json({
      gym: {
        id: String(req.gym._id),
        name: req.gym.businessName,
        branding: req.gym.branding,
      },
      stats: {
        members: admin.clients.length,
        coaches: admin.coaches.length,
        activeMembers: admin.clients.filter(
          (client) => client.profile?.isActive !== false
        ).length,
        routines,
      },
      recentMembers: recent.map((user) => serializeMember(user, coachNames)),
      coaches: coachList.map((coach) => serializeCoach(coach, counts)),
    });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/gym/access-pin - generate a one-time setup PIN for a new member
// ---------------------------------------------------------------------------
router.post("/access-pin", async (_req, res, next) => {
  try {
    const pin = await generateAccessPin();

    return res.json({ pin, formatted: formatPin(pin) });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// Coach management
// ---------------------------------------------------------------------------
router.get("/coaches", async (req, res, next) => {
  try {
    const admin = await getGymAdmin(req.user.gymId);
    const counts = coachClientCounts(admin);

    return res.json(
      sortByCreatedAt(admin.coaches, 1).map((coach) =>
        serializeCoach(coach, counts)
      )
    );
  } catch (error) {
    return next(error);
  }
});

router.post("/coaches", async (req, res, next) => {
  try {
    const name = String(req.body.name ?? "").trim();

    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    const pinResult = await resolveSetupPin(req.body.pin);

    if (pinResult.error) {
      return res.status(pinResult.status).json({ message: pinResult.error });
    }

    const admin = await getGymAdmin(req.user.gymId);

    // Pending coaches have no credentials: the setup PIN is their only way in
    // until they choose an email/password on the account page.
    admin.coaches.push({
      email: "",
      password: "",
      claimPin: pinResult.pin,
      role: "coach",
      profile: {
        name,
        speciality: String(req.body.speciality ?? "").trim(),
        phone: String(req.body.phone ?? "").trim(),
      },
    });

    await admin.save();

    const coach = admin.coaches[admin.coaches.length - 1];

    return res.status(201).json(
      serializeCoach(coach, new Map([[String(coach._id), 0]]))
    );
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// Client management
// ---------------------------------------------------------------------------
router.get("/clients", async (req, res, next) => {
  try {
    const admin = await getGymAdmin(req.user.gymId);
    const coachNames = coachNameMap(admin);

    return res.json(
      sortByCreatedAt(admin.clients, -1).map((client) =>
        serializeMember(client, coachNames)
      )
    );
  } catch (error) {
    return next(error);
  }
});

router.post("/clients", async (req, res, next) => {
  try {
    const name = String(req.body.name ?? "").trim();

    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    const pinResult = await resolveSetupPin(req.body.pin);

    if (pinResult.error) {
      return res.status(pinResult.status).json({ message: pinResult.error });
    }

    const admin = await getGymAdmin(req.user.gymId);

    // Clients are always created unassigned and without credentials. The setup
    // PIN is redeemed on the account page.
    admin.clients.push({
      email: "",
      password: "",
      claimPin: pinResult.pin,
      role: "client",
      coachId: null,
      coach: "",
      profile: {
        name,
        phone: String(req.body.phone ?? "").trim(),
      },
    });

    await admin.save();

    const client = admin.clients[admin.clients.length - 1];

    return res
      .status(201)
      .json(serializeMember(client, new Map()));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/gym/users/:id - edit a coach or client in place
// ---------------------------------------------------------------------------
router.patch("/users/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid account id." });
    }

    // findMember searches coaches first, then clients, within this admin only.
    const admin = await getGymAdmin(req.user.gymId);
    const user = findMember(admin, req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    const body = req.body;

    if (body.name !== undefined) {
      user.profile.name = String(body.name).trim();
    }

    if (body.speciality !== undefined) {
      user.profile.speciality = String(body.speciality).trim();
    }

    if (body.phone !== undefined) {
      user.profile.phone = String(body.phone).trim();
    }

    if (body.isActive !== undefined) {
      const nextActive = Boolean(body.isActive);

      // Bump only on an active -> inactive transition so repeat saves do not
      // revoke sessions unnecessarily.
      if (nextActive === false && user.profile.isActive !== false) {
        user.sessionVersion = Number(user.sessionVersion ?? 0) + 1;
      }

      user.profile.isActive = nextActive;
    }

    if (body.email !== undefined) {
      const email = normalizeEmail(body.email);

      if (!EMAIL_PATTERN.test(email)) {
        return res.status(400).json({ message: "Enter a valid email address." });
      }

      if (await emailAlreadyExists(email, user._id)) {
        return res.status(409).json({
          message: "An account with that email already exists.",
        });
      }

      if (user.email !== email) {
        // Changing the login identity invalidates tokens issued for the old one.
        user.sessionVersion = Number(user.sessionVersion ?? 0) + 1;
      }

      user.email = email;
    }

    if (body.password !== undefined && String(body.password).length > 0) {
      if (String(body.password).length < 8) {
        return res
          .status(400)
          .json({ message: "Password must be at least 8 characters." });
      }

      user.password = String(body.password);
      // Force re-login everywhere after a password change.
      user.sessionVersion = Number(user.sessionVersion ?? 0) + 1;
    }

    // Coach assignment is deliberately not editable here; coaches claim their
    // own clients through /api/coach/*.

    await admin.save();

    const coachNames = coachNameMap(admin);

    return res.json(
      user.role === "coach"
        ? serializeCoach(user, coachClientCounts(admin))
        : serializeMember(user, coachNames)
    );
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/gym/users/:id - remove a coach or client
// ---------------------------------------------------------------------------
router.delete("/users/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid account id." });
    }

    const admin = await getGymAdmin(req.user.gymId);
    const user = findMember(admin, req.params.id);

    if (!user) {
      return res.status(404).json({ message: "Account not found." });
    }

    if (user.role === "coach") {
      // Deleting a coach has cascading effects: unassign their clients, drop
      // routine mirrors that pointed at their routines, then delete routines.
      const routines = await Routine.find({
        gymId: req.user.gymId,
        coachId: user._id,
      })
        .select("routineCode")
        .lean();

      // routineId on a client mirror is the routine's routineCode.
      const routineIds = new Set(
        routines.map((routine) => routine.routineCode).filter(Boolean)
      );

      for (const client of admin.clients) {
        if (String(client.coachId ?? "") === String(user._id)) {
          client.coachId = null;
          client.coach = "";
        }

        if (routineIds.size > 0) {
          client.workoutRoutines = (client.workoutRoutines ?? []).filter(
            (routine) => !routineIds.has(routine.routineId)
          );
        }
      }

      await Routine.deleteMany({
        gymId: req.user.gymId,
        coachId: user._id,
      });

      admin.coaches.pull({ _id: user._id });
    } else {
      // Removing a client leaves their ProgressLogs/routines in place; those
      // documents retain the now-dangling clientId for historical reporting.
      admin.clients.pull({ _id: user._id });
    }

    await admin.save();

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
