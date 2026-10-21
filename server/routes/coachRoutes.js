/**
 * Coach routes: browse gym clients, manage the coach's roster, and read
 * dashboard stats.
 *
 * Clients are created only by the gym administrator. Coaches browse the full
 * admin-created roster through /all-clients and explicitly select the clients
 * they want to coach. A selected client stores this coach's subdocument id in
 * `coachId` and two initials in `coach` (for example "S.Q.").
 *
 * Unassigning is a soft removal: the client account remains in the gym and can
 * be selected by another coach later.
 */

import { Router } from "express";
import mongoose from "mongoose";
import Routine from "../models/Routine.js";
import ProgressLog from "../models/ProgressLog.js";
import auth from "../middleware/auth.js";
import checkAccess from "../middleware/checkAccess.js";
import requireRole from "../middleware/requireRole.js";
import { coachInitials, getGymAdmin } from "../utils/members.js";
import { serializeProgressLog } from "../utils/progress.js";

const router = Router();

// Every endpoint below requires a coach in an active gym subscription.
router.use(auth, checkAccess, requireRole("coach"));

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
    coach: client.coach || "",
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
// GET /api/coach/all-clients - every client created by the gym admin
// ---------------------------------------------------------------------------
router.get("/all-clients", async (req, res, next) => {
  try {
    const admin = await getGymAdmin(req.user.gymId);
    const coachNames = new Map(
      admin.coaches.map((coach) => [
        String(coach._id),
        coach.profile?.name || coach.email,
      ])
    );

    const clients = [...admin.clients]
      .sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime()
      )
      .map((client) => {
        const assignedCoachId = client.coachId
          ? String(client.coachId)
          : null;
        const assignedToMe = assignedCoachId === String(req.user.userId);

        return {
          id: String(client._id),
          name: client.profile?.name || "",
          email: client.email,
          active: client.profile?.isActive !== false,
          coachId: assignedCoachId,
          coachName: assignedCoachId
            ? coachNames.get(assignedCoachId) ?? ""
            : "",
          coach: client.coach || "",
          assignedToMe,
          // A client can only be coached by one person at a time.
          available: !assignedCoachId || assignedToMe,
          joinedAt: client.createdAt,
        };
      });

    return res.json(clients);
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/coach/clients/:id/select - add a gym client to this coach's roster
// ---------------------------------------------------------------------------
router.post("/clients/:id/select", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid client id." });
    }

    const admin = await getGymAdmin(req.user.gymId);
    const client = admin.clients.find(
      (candidate) => String(candidate._id) === String(req.params.id)
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    // Never steal a client from another coach; the gym admin owns reassignment.
    if (client.coachId && String(client.coachId) !== String(req.user.userId)) {
      return res.status(409).json({
        message: "This client is already assigned to another coach.",
      });
    }

    const coach = admin.coaches.find(
      (candidate) => String(candidate._id) === String(req.user.userId)
    );

    client.coachId = req.user.userId;
    client.coach = coachInitials(coach?.profile?.name || coach?.email || "");

    await admin.save();

    return res.json({
      ...serializeClient(client),
      coachId: String(req.user.userId),
      coachName: coach?.profile?.name || coach?.email || "",
      assignedToMe: true,
      available: true,
    });
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

    // Unassigning also removes this coach's routines from the client so they do
    // not keep seeing workouts from a coach who no longer tracks them.
    const routines = await Routine.find({
      gymId: req.user.gymId,
      coachId: req.user.userId,
      clientId: client._id,
    })
      .select("routineCode")
      .lean();

    const routineIds = new Set(
      routines.map((routine) => routine.routineCode).filter(Boolean)
    );

    if (routineIds.size > 0) {
      client.workoutRoutines = (client.workoutRoutines ?? []).filter(
        (routine) => !routineIds.has(routine.routineId)
      );

      await Routine.updateMany(
        {
          gymId: req.user.gymId,
          coachId: req.user.userId,
          clientId: client._id,
        },
        { $set: { clientId: null } }
      );
    }

    client.coachId = null;
    client.coach = "";
    await admin.save();

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/coach/clients/:id/progress - one roster client's logged progress
// ---------------------------------------------------------------------------
router.get("/clients/:id/progress", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid client id." });
    }

    const admin = await getGymAdmin(req.user.gymId);
    // Roster ownership is part of the lookup, so a coach can never read another
    // coach's client progress by guessing a valid id.
    const client = admin.clients.find(
      (candidate) =>
        String(candidate._id) === String(req.params.id) &&
        String(candidate.coachId ?? "") === String(req.user.userId)
    );

    if (!client) {
      return res.status(404).json({ message: "Client not found." });
    }

    const logs = await ProgressLog.find({
      gymId: req.user.gymId,
      clientId: client._id,
    })
      .populate(
        "exerciseId",
        "name title body_part primaryMuscle targetMuscles"
      )
      .sort({ date: -1, createdAt: -1 })
      .limit(500)
      .lean();

    return res.json({
      client: {
        id: String(client._id),
        name: client.profile?.name || "",
        email: client.email,
      },
      logs: logs.map(serializeProgressLog),
    });
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
