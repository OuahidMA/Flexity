/**
 * Progress log helpers shared by the client and coach routes.
 *
 * A progress log stores one exercise performed on one day, with one entry per
 * set. Sets record either reps or a time interval (never both), and weight is
 * nullable so bodyweight work can be logged explicitly as "None".
 */

import mongoose from "mongoose";

const MAX_SETS = 30;

/**
 * Creates an Error carrying an HTTP status for the central error handler.
 *
 * @param {number} status
 * @param {string} message
 * @returns {Error}
 */
export function progressError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

/**
 * Normalizes a client-supplied date to UTC midnight.
 *
 * Accepts a `yyyy-mm-dd` input value or any parseable date string. Storing a
 * date-only value makes one workout per day idempotent regardless of the
 * client's timezone offset.
 *
 * @param {unknown} value
 * @returns {Date}
 * @throws {Error} 400 when the value is not a valid date.
 */
export function normalizeProgressDate(value) {
  const candidate =
    typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? new Date(`${value}T00:00:00.000Z`)
      : value
        ? new Date(value)
        : new Date();

  if (Number.isNaN(candidate.getTime())) {
    throw progressError(400, "Select a valid workout date.");
  }

  return new Date(
    Date.UTC(
      candidate.getUTCFullYear(),
      candidate.getUTCMonth(),
      candidate.getUTCDate()
    )
  );
}

/**
 * Validates and normalizes the per-set tracking data for one exercise.
 *
 * The coach's `trackingType` decides which metric is required: reps for
 * strength work or seconds for timed work. Weight may be null, which means the
 * client selected "None" for a bodyweight set.
 *
 * @param {unknown} input Raw `sets` array from the request body.
 * @param {"reps"|"time"} trackingType
 * @returns {Array<{ setNumber: number, reps: number, timeSec: number, weight: number|null }>}
 * @throws {Error} 400 when a set is missing or invalid.
 */
export function normalizeProgressSets(input, trackingType) {
  if (!Array.isArray(input) || input.length === 0) {
    throw progressError(400, "Log at least one set for this exercise.");
  }

  if (input.length > MAX_SETS) {
    throw progressError(
      400,
      `A single exercise cannot log more than ${MAX_SETS} sets.`
    );
  }

  return input.map((set, index) => {
    const setNumber = index + 1;
    const metric = Number(
      trackingType === "time" ? set?.timeSec : set?.reps
    );

    if (!Number.isFinite(metric) || metric < 1) {
      throw progressError(
        400,
        `Set ${setNumber} needs a valid ${
          trackingType === "time" ? "time in seconds" : "rep count"
        }.`
      );
    }

    // `null`, undefined and "" all mean the client chose "None".
    const hasWeight =
      set?.weight !== null &&
      set?.weight !== undefined &&
      set?.weight !== "";

    let weight = null;

    if (hasWeight) {
      weight = Number(set.weight);

      if (!Number.isFinite(weight) || weight < 0) {
        throw progressError(400, `Set ${setNumber} has an invalid weight.`);
      }
    }

    return {
      setNumber,
      reps: trackingType === "time" ? 0 : Math.round(metric),
      timeSec: trackingType === "time" ? Math.round(metric) : 0,
      weight,
    };
  });
}

/**
 * Converts a ProgressLog document/lean object into the API shape.
 *
 * Volume is derived rather than stored so the formula can change without a
 * migration. Timed work contributes no volume because it has no reps.
 *
 * @param {object} log Mongoose document or lean object, optionally populated.
 * @returns {object} Serialized log with per-set tracking data.
 */
export function serializeProgressLog(log) {
  const raw = typeof log.toObject === "function" ? log.toObject() : log;

  // A populated Exercise document is an object, but so is a bare ObjectId.
  // isValidObjectId distinguishes the two so an unpopulated log still returns
  // its stored id instead of "undefined".
  const catalog =
    raw.exerciseId &&
    typeof raw.exerciseId === "object" &&
    !mongoose.isValidObjectId(raw.exerciseId)
      ? raw.exerciseId
      : null;

  const sets = (raw.trackingData ?? []).map((set, index) => ({
    setNumber: set.setNumber ?? index + 1,
    reps: Number(set.reps) || 0,
    timeSec: Number(set.timeSec) || 0,
    weight: set.weight === null || set.weight === undefined
      ? null
      : Number(set.weight),
  }));

  const volume = sets.reduce(
    (total, set) =>
      total + (set.weight == null ? 0 : set.weight * set.reps),
    0
  );

  return {
    id: String(raw._id),
    date: raw.date,
    routineId: raw.routineId ? String(raw.routineId) : null,
    routineName: raw.routineName ?? "",
    dayOfWeek: raw.dayOfWeek ?? null,
    dayLabel: raw.dayLabel ?? "",
    exerciseId: catalog
      ? String(catalog._id)
      : raw.exerciseId
        ? String(raw.exerciseId)
        : "",
    exerciseOrder: raw.exerciseOrder ?? 0,
    exerciseName:
      raw.exerciseName || catalog?.title || catalog?.name || "Exercise",
    primaryMuscle:
      raw.primaryMuscle ||
      catalog?.body_part ||
      catalog?.primaryMuscle ||
      catalog?.targetMuscles?.primary?.[0] ||
      "",
    trackingType: raw.trackingType === "time" ? "time" : "reps",
    sets: sets.length,
    trackingData: sets,
    volume,
  };
}
