/**
 * Client self-service routes.
 *
 * Every route is scoped to the authenticated client: `req.user.userId` is the
 * embedded client subdocument id and `req.user.gymId` the tenant. The router
 * applies auth -> account/subscription check -> client role once for the whole
 * module.
 *
 * Note that routine assignment is stored in two places: the authoritative
 * Routine documents and a lightweight mirror on the embedded client's
 * `workoutRoutines` array (maintained by coachRoutes/routineRoutes).
 */

import { Router } from "express";
import Routine from "../models/Routine.js";
import ProgressLog from "../models/ProgressLog.js";
import auth from "../middleware/auth.js";
import checkAccess from "../middleware/checkAccess.js";
import requireRole from "../middleware/requireRole.js";
import { getGymAdmin } from "../utils/members.js";

const router = Router();

// Shared auth/tenant/role gate for every client endpoint below.
router.use(auth, checkAccess, requireRole("client"));

// ---------------------------------------------------------------------------
// GET /api/client/workouts - routines assigned to this client
// ---------------------------------------------------------------------------
router.get("/workouts", async (req, res, next) => {
  try {
    // Archived routines stay in the coach's history but disappear from the
    // client's active workout list. The admin is loaded to resolve coach names.
    const [routines, admin] = await Promise.all([
      Routine.find({
        gymId: req.user.gymId,
        clientId: req.user.userId,
        status: { $ne: "archived" },
      })
        .sort({ updatedAt: -1 })
        .lean(),
      getGymAdmin(req.user.gymId),
    ]);

    // Map embedded coach ids to display names in one pass.
    const coachNames = new Map(
      admin.coaches.map((coach) => [
        String(coach._id),
        coach.profile?.name || coach.email,
      ])
    );

    return res.json(
      routines.map((routine) => ({
        id: String(routine._id),
        routineCode: routine.routineCode ?? null,
        name: routine.name,
        description: routine.description ?? "",
        goal: routine.goal ?? "",
        status: routine.status,
        coachName: coachNames.get(String(routine.coachId)) ?? "",
        exercises: (routine.exercises ?? []).map((item) => ({
          exerciseId: String(item.exerciseId),
          name: item.name,
          primaryMuscle: item.primaryMuscle ?? "",
          sets: item.sets,
          reps: item.reps,
          restSec: item.restSec,
          notes: item.notes ?? "",
          order: item.order,
        })),
        exerciseCount: routine.exercises?.length ?? 0,
        totalSets: (routine.exercises ?? []).reduce(
          (total, item) => total + (Number(item.sets) || 0),
          0
        ),
        updatedAt: routine.updatedAt,
      }))
    );
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/client/progress - flattened progress feed with computed volume
// ---------------------------------------------------------------------------
router.get("/progress", async (req, res, next) => {
  try {
    const logs = await ProgressLog.find({
      gymId: req.user.gymId,
      clientId: req.user.userId,
    })
      .populate("exerciseId", "name primaryMuscle")
      .sort({ date: -1 })
      .lean();

    return res.json(
      logs.map((log) => {
        const sets = log.trackingData ?? [];
        // Volume is intentionally derived here rather than stored, so changing
        // the formula does not require a migration.
        const volume = sets.reduce(
          (total, set) =>
            total + (Number(set.weight) || 0) * (Number(set.reps) || 0),
          0
        );

        return {
          id: String(log._id),
          date: log.date,
          exerciseId: log.exerciseId?._id
            ? String(log.exerciseId._id)
            : String(log.exerciseId ?? ""),
          exerciseName: log.exerciseId?.name || "Exercise",
          primaryMuscle: log.exerciseId?.primaryMuscle || "",
          sets: sets.length,
          volume,
        };
      })
    );
  } catch (error) {
    return next(error);
  }
});

export default router;
