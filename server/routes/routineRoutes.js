/**
 * Routine routes (coach-only).
 *
 * A routine is always scoped to the coach's gym and authored coach. Assignment
 * to a client writes both the authoritative Routine document and a lightweight
 * mirror entry (`{ routineId, name }`) on the embedded client, where routineId
 * is the routine's routineCode. The mirror keeps the client's workout list cheap
 * to read; the sync helpers below keep it consistent when a routine is created,
 * renamed, reassigned, or deleted.
 *
 * Exercise input is validated against the catalog visibility rules and snapshotted
 * (name + primary muscle) into the routine so later catalog edits do not change
 * historical routines.
 */

import { Router } from "express";
import mongoose from "mongoose";
import Exercise from "../models/Exercise.js";
import Routine from "../models/Routine.js";
import auth from "../middleware/auth.js";
import checkAccess from "../middleware/checkAccess.js";
import requireRole from "../middleware/requireRole.js";
import { getGymAdmin, memberNameMaps } from "../utils/members.js";
import { generateRoutineCode } from "../utils/routineCodes.js";

const router = Router();

// All routine endpoints require an active coach account.
router.use(auth, checkAccess, requireRole("coach"));

/**
 * Creates an Error carrying an HTTP status for the central error handler.
 *
 * @param {number} status
 * @param {string} message
 * @returns {Error}
 */
function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * Converts a Routine document/lean object into the API shape, resolving coach
 * and client display names from the supplied maps.
 *
 * @param {object} routine Mongoose document or lean object.
 * @param {{ coachNames?: Map<string, string>, clientNames?: Map<string, string> }} [names]
 * @returns {object} Serialized routine.
 */
function serializeRoutine(routine, names = {}) {
  const raw =
    typeof routine.toObject === "function" ? routine.toObject() : routine;
  const coachNames = names.coachNames ?? new Map();
  const clientNames = names.clientNames ?? new Map();
  const coachId = raw.coachId ? String(raw.coachId) : null;
  const clientId = raw.clientId ? String(raw.clientId) : null;

  return {
    id: String(raw._id),
    routineCode: raw.routineCode ?? null,
    name: raw.name,
    description: raw.description ?? "",
    goal: raw.goal ?? "",
    status: raw.status,
    coachId,
    coachName: coachId ? coachNames.get(coachId) ?? "" : "",
    clientId,
    clientName: clientId ? clientNames.get(clientId) ?? "" : "",
    exercises: (raw.exercises ?? []).map((item) => ({
      exerciseId: String(item.exerciseId),
      name: item.name,
      primaryMuscle: item.primaryMuscle ?? "",
      sets: item.sets,
      reps: item.reps,
      restSec: item.restSec,
      notes: item.notes ?? "",
      order: item.order,
    })),
    exerciseCount: raw.exercises?.length ?? 0,
    totalSets: (raw.exercises ?? []).reduce(
      (total, item) => total + (Number(item.sets) || 0),
      0
    ),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

/** Finds an embedded client by subdocument id within this gym. */
function findClient(admin, clientId) {
  return admin.clients.find(
    (candidate) => String(candidate._id) === String(clientId)
  );
}

/**
 * Adds or renames a routine mirror on a client. Returns whether the admin
 * document changed, so callers can skip an unnecessary save.
 *
 * @param {object} admin Gym admin document.
 * @param {unknown} clientId
 * @param {{ routineId: string, name: string }} routine
 * @returns {boolean} True when the admin needs saving.
 */
function upsertClientRoutine(admin, clientId, routine) {
  const client = findClient(admin, clientId);

  if (!client) return false;

  const routines = client.workoutRoutines ?? [];
  const existing = routines.find(
    (entry) => entry.routineId === routine.routineId
  );

  if (existing) {
    if (existing.name === routine.name) return false;

    existing.name = routine.name;
    return true;
  }

  client.workoutRoutines = [
    ...routines,
    {
      routineId: routine.routineId,
      name: routine.name,
    },
  ];

  return true;
}

/**
 * Removes a routine mirror from a client. Returns whether anything was removed.
 *
 * @param {object} admin Gym admin document.
 * @param {unknown} clientId
 * @param {string} routineId Routine code stored on the mirror.
 * @returns {boolean} True when the admin needs saving.
 */
function removeClientRoutine(admin, clientId, routineId) {
  const client = findClient(admin, clientId);

  if (!client) return false;

  const routines = client.workoutRoutines ?? [];
  const remaining = routines.filter((entry) => entry.routineId !== routineId);

  if (remaining.length === routines.length) return false;

  client.workoutRoutines = remaining;

  return true;
}

/**
 * Validates an optional client assignment and returns the embedded client.
 * Null/empty means "unassigned"; invalid ids and ids from another gym throw 400.
 *
 * @param {object} admin Gym admin document.
 * @param {unknown} clientId
 * @returns {object|null}
 */
function resolveClient(admin, clientId) {
  if (!clientId) return null;

  if (!mongoose.isValidObjectId(clientId)) {
    throw httpError(400, "Select a valid client.");
  }

  const client = findClient(admin, clientId);

  if (!client) {
    throw httpError(400, "The selected client could not be found.");
  }

  return client;
}

/**
 * Builds the routine's exercise lines from client input.
 *
 * Only shared exercises and this gym's custom exercises are eligible, matching
 * the catalog read rules. Values are clamped to safe minimums (sets/reps >= 1,
 * rest >= 0), notes are capped, and `order` is derived from array position so
 * the client cannot inject arbitrary ordering or foreign exercise snapshots.
 *
 * @param {unknown} gymId
 * @param {Array<object>} input Raw `exercises` array from the request body.
 * @returns {Promise<Array<object>>} Validated embedded exercise lines.
 * @throws {Error} 400 when input is empty or references an unavailable exercise.
 */
async function buildExerciseLines(gymId, input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw httpError(400, "Add at least one exercise to the routine.");
  }

  const ids = input
    .map((item) => item?.exerciseId)
    .filter((id) => mongoose.isValidObjectId(id));

  const exercises = await Exercise.find({
    _id: { $in: ids },
    $or: [{ isCustom: false }, { createdByGymId: gymId ?? null }],
  }).lean();

  const byId = new Map(
    exercises.map((exercise) => [String(exercise._id), exercise])
  );

  return input.map((item, index) => {
    const exercise = byId.get(String(item?.exerciseId));

    if (!exercise) {
      throw httpError(
        400,
        "One of the selected exercises is no longer available. Remove it and try again."
      );
    }

    return {
      exerciseId: exercise._id,
      name: exercise.name,
      primaryMuscle: exercise.primaryMuscle,
      sets: Math.max(1, Number(item.sets) || 1),
      reps: Math.max(1, Number(item.reps) || 1),
      restSec: Math.max(0, Number(item.restSec) || 0),
      notes: String(item.notes ?? "").slice(0, 500),
      order: index,
    };
  });
}

/**
 * Trims and validates a routine name.
 *
 * @param {unknown} name
 * @returns {string}
 * @throws {Error} 400 when the name is empty.
 */
function validateName(name) {
  const trimmed = String(name ?? "").trim();

  if (!trimmed) {
    throw httpError(400, "Routine name is required.");
  }

  return trimmed;
}

/**
 * Normalizes a create/update request into fields safe to persist.
 *
 * `coachId` is preserved from the existing routine (ownership cannot be
 * transferred via the body), and an unknown status falls back to the current
 * value or "active" for new routines.
 *
 * @param {import("express").Request} req
 * @param {object|null} existing Routine being updated, or null on create.
 * @param {object} admin Gym admin document for client lookup.
 * @returns {Promise<object>} Persistable routine fields.
 */
async function routinePayload(req, existing, admin) {
  const gymId = req.user.gymId;
  const name = validateName(req.body.name);
  const client = resolveClient(admin, req.body.clientId);
  const exercises = await buildExerciseLines(gymId, req.body.exercises);
  const status = ["draft", "active", "archived"].includes(req.body.status)
    ? req.body.status
    : existing?.status ?? "active";

  return {
    gymId,
    coachId: existing?.coachId ?? req.user.userId,
    clientId: client?._id ?? null,
    name,
    description: String(req.body.description ?? "").trim(),
    goal: String(req.body.goal ?? "").trim(),
    status,
    exercises,
  };
}

// ---------------------------------------------------------------------------
// GET /api/routines - list the coach's routines
// ---------------------------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    // Only the authoring coach sees a routine; routineCode is not a lookup key
    // for this endpoint.
    const [routines, admin] = await Promise.all([
      Routine.find({
        gymId: req.user.gymId,
        coachId: req.user.userId,
      })
        .sort({ updatedAt: -1 })
        .lean(),
      getGymAdmin(req.user.gymId),
    ]);

    const names = memberNameMaps(admin);

    return res.json(routines.map((routine) => serializeRoutine(routine, names)));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/routines - create a routine (optionally assigned to a client)
// ---------------------------------------------------------------------------
router.post("/", async (req, res, next) => {
  try {
    const admin = await getGymAdmin(req.user.gymId);
    const payload = await routinePayload(req, null, admin);
    const routineCode = await generateRoutineCode();
    const created = await Routine.create({ ...payload, routineCode });

    // Mirror the assignment on the embedded client so their workout list can be
    // served without querying Routine.
    if (created.clientId) {
      const changed = upsertClientRoutine(admin, created.clientId, {
        routineId: routineCode,
        name: created.name,
      });

      if (changed) await admin.save();
    }

    return res
      .status(201)
      .json(serializeRoutine(created, memberNameMaps(admin)));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// GET /api/routines/:id - fetch one routine owned by this coach
// ---------------------------------------------------------------------------
router.get("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid routine id." });
    }

    const [routine, admin] = await Promise.all([
      Routine.findOne({
        _id: req.params.id,
        gymId: req.user.gymId,
        coachId: req.user.userId,
      }).lean(),
      getGymAdmin(req.user.gymId),
    ]);

    if (!routine) {
      return res.status(404).json({ message: "Routine not found." });
    }

    return res.json(serializeRoutine(routine, memberNameMaps(admin)));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// PUT /api/routines/:id - update a routine and re-sync client assignment
// ---------------------------------------------------------------------------
router.put("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid routine id." });
    }

    const admin = await getGymAdmin(req.user.gymId);
    const existing = await Routine.findOne({
      _id: req.params.id,
      gymId: req.user.gymId,
      coachId: req.user.userId,
    });

    if (!existing) {
      return res.status(404).json({ message: "Routine not found." });
    }

    // Remember the old assignment before applying the payload so mirrors can be
    // removed from a client that is being unassigned/reassigned.
    const previousClientId = existing.clientId
      ? String(existing.clientId)
      : null;

    // Backfill a code for routines created before codes existed. The code is
    // stable afterward because it is the client mirror's routineId.
    if (!existing.routineCode) {
      existing.routineCode = await generateRoutineCode();
    }

    const payload = await routinePayload(req, existing, admin);

    existing.set(payload);
    await existing.save();

    const nextClientId = existing.clientId ? String(existing.clientId) : null;
    let changed = false;

    if (previousClientId && previousClientId !== nextClientId) {
      changed =
        removeClientRoutine(
          admin,
          previousClientId,
          existing.routineCode
        ) || changed;
    }

    if (nextClientId) {
      changed =
        upsertClientRoutine(admin, nextClientId, {
          routineId: existing.routineCode,
          name: existing.name,
        }) || changed;
    }

    if (changed) await admin.save();

    return res.json(serializeRoutine(existing, memberNameMaps(admin)));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/routines/:id - delete the routine and its client mirror
// ---------------------------------------------------------------------------
router.delete("/:id", async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid routine id." });
    }

    // findOneAndDelete both checks ownership and removes the document atomically.
    const routine = await Routine.findOneAndDelete({
      _id: req.params.id,
      gymId: req.user.gymId,
      coachId: req.user.userId,
    });

    if (!routine) {
      return res.status(404).json({ message: "Routine not found." });
    }

    if (routine.clientId && routine.routineCode) {
      const admin = await getGymAdmin(req.user.gymId);
      const changed = removeClientRoutine(
        admin,
        routine.clientId,
        routine.routineCode
      );

      if (changed) await admin.save();
    }

    return res.json({ success: true });
  } catch (error) {
    return next(error);
  }
});

export default router;
