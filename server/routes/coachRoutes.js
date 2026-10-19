/**
 * Coach routes: manage the coach's own clients and read dashboard stats.
 *
 * Coaches are embedded members, so a coach only sees clients whose `coachId`
 * points at their subdocument id inside the gym admin's `clients` array. Every
 * query is additionally scoped by `req.user.gymId`.
 *
 * Deleting a client here is a soft unassign: the client account remains in the
 * gym (and can still sign in) but its coachId is cleared.
 */

import { Router } from "express";
import mongoose from "mongoose";
import Routine from "../models/Routine.js";
import auth from "../middleware/auth.js";
import checkAccess from "../middleware/checkAccess.js";
import requireRole from "../middleware/requireRole.js";
import { normalizeEmail } from "../utils/session.js";
import { findAccountByEmail, getGymAdmin } from "../utils/members.js";

const router = Router();

// Every endpoint below requires a coach in an active gym subscription.
router.use(auth, checkAccess, requireRole("coach"));

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Shapes an embedded client for coach-facing responses. Routine references are
 * the lightweight mirror entries, not full Routine documents.
 *
 * @param {object} client Embedded client subdocument.
 * @returns {object} Serialized client.
 */
function serializeClient(client) {
  return {
    id: String(client._id),
    name: client.profile?.name || "",
    email: client.email,
    active: client.profile?.isActive !== false,
    workoutRoutines: (client.workoutRoutines ?? []).map((routine) => ({
      routineId: routine.routineId,
      name: routine.name,
    })),
    joinedAt: client.createdAt,
  };
}

// ---------------------------------------------------------------------------
// GET /api/coach/clients - clients assigned to this coach
// ---------------------------------------------------------------------------
router.get("/clients", async (req, res, next) => {
  try {
    const admin = await getGymAdmin(req.user.gymId);
    const clients = admin.clients
      // Ownership check is part of the filter, not a post-fetch authorization
      // step, so a coach can never receive another coach's clients.
      .filter(
        (client) => String(client.coachId ?? "") === String(req.user.userId)
      )
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      );

    return res.json(clients.map(serializeClient));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/coach/clients - create and auto-assign a client
// ---------------------------------------------------------------------------
router.post("/clients", async (req, res, next) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password ?? "");

    if (!name) {
      return res.status(400).json({ message: "Name is required." });
    }

    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    // Emails must be globally unique across top-level users and embedded members.
    if (await findAccountByEmail(email)) {
      return res.status(409).json({
        message: "An account with that email already exists.",
      });
    }

    const admin = await getGymAdmin(req.user.gymId);

    // Pushing onto the admin document lets the client subdocument's pre-save
    // hook hash the password when admin.save() runs.
    admin.clients.push({
      email,
      password,
      role: "client",
      coachId: req.user.userId,
      profile: {
        name,
        phone: String(req.body.phone ?? "").trim(),
      },
    });

    await admin.save();

    return res
      .status(201)
      .json(serializeClient(admin.clients[admin.clients.length - 1]));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/coach/clients/:id - unassign (do not delete) a client
// ---------------------------------------------------------------------------
router.delete("/clients/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid client id." });
    }

    const admin = await getGymAdmin(req.user.gymId);
    // The coachId condition prevents a coach from touching a client owned by
    // someone else even if they guess a valid id.
    const client = admin.clients.find(
      (candidate) =>
        String(candidate._id) === String(req.params.id) &&
        String(candidate.coachId ?? "") === String(req.user.userId)
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    client.coachId = null;
    await admin.save();

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/coach/overview - counts for the coach dashboard
// ---------------------------------------------------------------------------
router.get("/overview", async (req, res, next) => {
  try {
    const admin = await getGymAdmin(req.user.gymId);
    const clients = admin.clients.filter(
      (client) => String(client.coachId ?? "") === String(req.user.userId)
    );

    const [routines, activeRoutines] = await Promise.all([
      Routine.countDocuments({
        gymId: req.user.gymId,
        coachId: req.user.userId,
      }),
      Routine.countDocuments({
        gymId: req.user.gymId,
        coachId: req.user.userId,
        status: "active",
      }),
    ]);

    return res.json({
      clients: clients.length,
      activeClients: clients.filter(
        (client) => client.profile?.isActive !== false
      ).length,
      routines,
      activeRoutines,
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
