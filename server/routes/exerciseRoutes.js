/**
 * Exercise catalog routes.
 *
 * Read access is available to any authenticated user in an active gym; writes
 * are limited to gym_admin/coach. Visibility is tenant-aware: everyone sees
 * shared exercises (`isCustom: false`) plus their own gym's custom exercises.
 * Deletion is restricted to custom exercises owned by the caller's gym, so a
 * gym cannot remove shared or another tenant's catalog entries.
 */

import { Router } from "express";
import mongoose from "mongoose";
import Exercise from "../models/Exercise.js";
import auth from "../middleware/auth.js";
import checkAccess from "../middleware/checkAccess.js";
import requireRole from "../middleware/requireRole.js";

const router = Router();

// Authentication and tenant/subscription checks apply to all catalog routes.
router.use(auth, checkAccess);

/**
 * Converts a Mongoose exercise document into the public API shape.
 *
 * @param {object} exercise Exercise document or lean object.
 * @returns {object} Serialized exercise.
 */
function serializeExercise(exercise) {
  return {
    id: String(exercise._id),
    name: exercise.name,
    primaryMuscle: exercise.primaryMuscle,
    secondaryMuscles: exercise.secondaryMuscles ?? [],
    isCustom: Boolean(exercise.isCustom),
    createdAt: exercise.createdAt,
  };
}

/**
 * Accepts either an array or a comma-separated string and returns clean,
 * non-empty strings.
 *
 * @param {unknown} value
 * @returns {string[]}
 */
function normalizeMuscles(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  return String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Escapes regex metacharacters before embedding user input in a RegExp, so a
 * search string such as "(" cannot throw or alter the query.
 *
 * @param {string} value
 * @returns {string}
 */
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// ---------------------------------------------------------------------------
// GET /api/exercises - shared catalog + this gym's custom exercises
// ---------------------------------------------------------------------------
router.get("/", async (req, res, next) => {
  try {
    const filters = [
      // Tenant visibility boundary: shared rows or rows owned by this gym.
      {
        $or: [
          { isCustom: false },
          { createdByGymId: req.user.gymId ?? null },
        ],
      },
    ];

    const search = String(req.query.search ?? "").trim();

    // A separate $or is required because combining visibility and search in one
    // $or would let search terms bypass the tenant boundary.
    if (search) {
      filters.push({
        $or: [
          { name: new RegExp(escapeRegex(search), "i") },
          { primaryMuscle: new RegExp(escapeRegex(search), "i") },
          { secondaryMuscles: new RegExp(escapeRegex(search), "i") },
        ],
      });
    }

    const exercises = await Exercise.find({ $and: filters })
      .sort({ name: 1 })
      .lean();

    return res.json(exercises.map(serializeExercise));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// POST /api/exercises - create a gym-owned custom exercise
// ---------------------------------------------------------------------------
router.post("/", requireRole("gym_admin", "coach"), async (req, res, next) => {
  try {
    const name = String(req.body.name ?? "").trim();
    const primaryMuscle = String(req.body.primaryMuscle ?? "").trim();
    const secondaryMuscles = normalizeMuscles(req.body.secondaryMuscles);

    if (!name) {
      return res.status(400).json({ message: "Exercise name is required." });
    }

    if (!primaryMuscle) {
      return res
        .status(400)
        .json({ message: "A primary muscle group is required." });
    }

    // Case-insensitive exact-name check gives a friendlier 409 than the unique
    // index, which is case-sensitive by default.
    const existing = await Exercise.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    }).lean();

    if (existing) {
      return res
        .status(409)
        .json({ message: "An exercise with this name already exists." });
    }

    const exercise = await Exercise.create({
      name,
      primaryMuscle,
      secondaryMuscles,
      isCustom: true,
      createdByGymId: req.user.gymId ?? null,
    });

    return res.status(201).json(serializeExercise(exercise));
  } catch (error) {
    return next(error);
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/exercises/:id - delete only this gym's custom exercise
// ---------------------------------------------------------------------------
router.delete(
  "/:id",
  requireRole("gym_admin", "coach"),
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).json({ message: "Invalid exercise id." });
      }

      const exercise = await Exercise.findOne({
        _id: req.params.id,
        isCustom: true,
        createdByGymId: req.user.gymId ?? null,
      });

      if (!exercise) {
        return res.status(404).json({ message: "Exercise not found." });
      }

      await exercise.deleteOne();

      return res.json({ success: true });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;
