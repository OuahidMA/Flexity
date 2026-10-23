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
import mongoose from "mongoose";
import Routine from "../models/Routine.js";
import ProgressLog from "../models/ProgressLog.js";
import auth from "../middleware/auth.js";
import checkAccess from "../middleware/checkAccess.js";
import requireRole from "../middleware/requireRole.js";
import { getGymAdmin } from "../utils/members.js";
import {
  normalizeProgressDate,
  normalizeProgressSets,
  progressError,
  serializeProgressLog,
} from "../utils/progress.js";

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
      routines.map((routine) => {
        const mapExercise = (item) => ({
          exerciseId: String(item.exerciseId),
          name: item.name,
          primaryMuscle: item.primaryMuscle ?? "",
          sets: item.sets,
          trackingType: item.trackingType ?? "reps",
          reps: item.reps,
          timeSec: item.timeSec ?? 30,
          restSec: item.restSec,
          notes: item.notes ?? "",
          order: item.order,
        });
        // `days` fuels the client calendar. Older routines without a schedule
        // fall back to their flat exercise list.
        const days = (routine.days ?? []).map((day) => ({
          dayOfWeek: day.dayOfWeek,
          isRest: Boolean(day.isRest),
          label: day.label ?? "",
          exercises: (day.exercises ?? []).map(mapExercise),
        }));
        const allExercises = days.length
          ? days.flatMap((day) => day.exercises)
          : (routine.exercises ?? []).map(mapExercise);

        return {
          id: String(routine._id),
          routineCode: routine.routineCode ?? null,
          name: routine.name,
          description: routine.description ?? "",
          goal: routine.goal ?? "",
          splitType: routine.splitType ?? "push_pull_legs",
          scheduleMode: routine.scheduleMode ?? "week",
          days,
          status: routine.status,
          coachName: coachNames.get(String(routine.coachId)) ?? "",
          exercises: allExercises,
          exerciseCount: allExercises.length,
          totalSets: allExercises.reduce(
            (total, item) => total + (Number(item.sets) || 0),
            0
          ),
          updatedAt: routine.updatedAt,
        };
      })
    );
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/client/progress - progress feed with per-set tracking data
// ---------------------------------------------------------------------------
router.get("/progress", async (req, res, next) => {
  try {
    const logs = await ProgressLog.find({
      gymId: req.user.gymId,
      clientId: req.user.userId,
    })
      // The populated catalog entry is only a fallback: logs snapshot the
      // exercise name and muscle at save time.
      .populate(
        "exerciseId",
        "name title body_part primaryMuscle targetMuscles"
      )
      .sort({ date: -1, createdAt: -1 })
      .lean();

    return res.json(logs.map(serializeProgressLog));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/client/progress - save one exercise's set-by-set performance
// ---------------------------------------------------------------------------
router.post("/progress", async (req, res, next) => {
  try {
    const body = req.body ?? {};
    const date = normalizeProgressDate(body.date);
    const rawExerciseId = body.exerciseId ? String(body.exerciseId) : "";

    if (!mongoose.isValidObjectId(rawExerciseId)) {
      throw progressError(400, "Select a valid exercise to log.");
    }

    const requestedOrder = Number(body.exerciseOrder);
    const hasRequestedDay =
      body.dayOfWeek !== undefined &&
      body.dayOfWeek !== null &&
      body.dayOfWeek !== "";
    const requestedDay = hasRequestedDay ? Number(body.dayOfWeek) : null;

    if (
      requestedDay !== null &&
      (!Number.isInteger(requestedDay) || requestedDay < 0 || requestedDay > 6)
    ) {
      throw progressError(400, "Select a valid workout day.");
    }

    let routine = null;
    let routineLine = null;
    let routineDay = null;

    // When the log belongs to a routine, the routine is authoritative: the
    // exercise line supplies the prescription snapshot and the coach-selected
    // tracking mode. This also prevents logging arbitrary catalog exercises.
    if (body.routineId) {
      if (!mongoose.isValidObjectId(String(body.routineId))) {
        throw progressError(400, "Select a valid routine.");
      }

      routine = await Routine.findOne({
        _id: body.routineId,
        gymId: req.user.gymId,
        clientId: req.user.userId,
        status: { $ne: "archived" },
      });

      if (!routine) {
        throw progressError(400, "This routine is not assigned to you.");
      }

      // Flatten the routine's scheduled days (or its legacy flat list) so the
      // exercise line and its day label can be resolved in one lookup.
      const candidates = [];

      for (const day of routine.days ?? []) {
        for (const line of day.exercises ?? []) {
          candidates.push({ line, day });
        }
      }

      if (candidates.length === 0) {
        for (const line of routine.exercises ?? []) {
          candidates.push({ line, day: null });
        }
      }

      // Restrict to the client-selected weekday first so the same exercise/order
      // appearing on several days resolves to the correct line.
      const dayCandidates =
        requestedDay === null
          ? candidates
          : candidates.filter(
              (candidate) =>
                candidate.day &&
                Number(candidate.day.dayOfWeek) === requestedDay
            );

      const byOrder = Number.isFinite(requestedOrder)
        ? dayCandidates.find(
            (candidate) =>
              String(candidate.line.exerciseId) === rawExerciseId &&
              Number(candidate.line.order) === requestedOrder
          )
        : null;

      const match =
        byOrder ??
        dayCandidates.find(
          (candidate) => String(candidate.line.exerciseId) === rawExerciseId
        );

      if (!match) {
        throw progressError(
          400,
          "This exercise is not part of the selected routine."
        );
      }

      routineLine = match.line;
      routineDay = match.day;

      // The log's date must fall on the weekday the coach scheduled this day
      // for. Without this guard, a Thursday session could be saved with a
      // Friday date by reusing the same routine day.
      if (
        routineDay &&
        date.getUTCDay() !== Number(routineDay.dayOfWeek)
      ) {
        throw progressError(
          400,
          "This workout is not scheduled for the selected date."
        );
      }
    }

    const trackingType =
      (routineLine?.trackingType ?? body.trackingType) === "time"
        ? "time"
        : "reps";

    const exerciseName = String(
      routineLine?.name ?? body.exerciseName ?? ""
    ).trim();

    if (!exerciseName) {
      throw progressError(400, "Enter or select an exercise to log.");
    }

    const trackingData = normalizeProgressSets(body.sets, trackingType);

    // One log per routine line per day. Re-saving the same exercise updates the
    // existing entry instead of creating duplicates in the history/volume charts.
    const log = await ProgressLog.findOneAndUpdate(
      {
        gymId: req.user.gymId,
        clientId: req.user.userId,
        date,
        exerciseId: rawExerciseId,
        exerciseOrder: routineLine?.order ?? (Number.isFinite(requestedOrder)
          ? requestedOrder
          : 0),
        dayOfWeek: routineDay?.dayOfWeek ?? requestedDay,
        routineId: routine?._id ?? null,
      },
      {
        $set: {
          clientId: req.user.userId,
          gymId: req.user.gymId,
          date,
          exerciseId: rawExerciseId,
          routineId: routine?._id ?? null,
          routineName: routine?.name ?? String(body.routineName ?? "").trim(),
          dayOfWeek: routineDay?.dayOfWeek ?? requestedDay,
          dayLabel: routineDay?.label ?? String(body.dayLabel ?? "").trim(),
          exerciseName,
          primaryMuscle: String(
            routineLine?.primaryMuscle ?? body.primaryMuscle ?? ""
          ).trim(),
          exerciseOrder: routineLine?.order ?? (Number.isFinite(requestedOrder)
            ? requestedOrder
            : 0),
          trackingType,
          trackingData,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true, runValidators: true }
    );

    return res.status(201).json(serializeProgressLog(log));
  } catch (error) {
    return next(error);
  }
});

export default router;
