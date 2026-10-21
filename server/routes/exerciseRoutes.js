/**
 * Exercise catalog routes.
 *
 * Read access is available to any authenticated user in an active gym; writes
 * are limited to gym_admin/coach. Visibility is tenant-aware: everyone sees the
 * seeded library (rows where `isCustom` is missing or false) plus their own
 * gym's custom exercises. Deletion is restricted to custom exercises owned by
 * the caller's gym, so a gym cannot remove library or another tenant's entries.
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
 * Converts a catalog document into the public API shape.
 *
 * Library rows identify themselves with `title` / `body_part` while custom rows
 * use `name` / `primaryMuscle`. The response exposes one normalized shape so the
 * front end does not need to know which storage variant it received.
 *
 * @param {object} exercise Exercise document or lean object.
 * @returns {object} Serialized exercise.
 */
function serializeExercise(exercise) {
  const primaryMuscles = exercise.targetMuscles?.primary ?? [];
  const secondaryMuscles = exercise.targetMuscles?.secondary?.length
    ? exercise.targetMuscles.secondary
    : exercise.secondaryMuscles ?? [];
  const name = exercise.title || exercise.name || "";
  const primaryMuscle =
    exercise.body_part || exercise.primaryMuscle || primaryMuscles[0] || "";

  return {
    id: String(exercise._id),
    name,
    title: name,
    description: exercise.description ?? "",
    primaryMuscle,
    bodyPart: exercise.body_part ?? "",
    secondaryMuscles,
    targetMuscles: {
      primary: primaryMuscles,
      secondary: secondaryMuscles,
    },
    equipment: exercise.equipment ?? "",
    equipmentCategory: exercise.equipmentCategory ?? "",
    category: exercise.category ?? "",
    difficulty: exercise.difficulty ?? "",
    mechanic: exercise.mechanic ?? "",
    forceType: exercise.force_type ?? "",
    goals: exercise.goals ?? [],
    tags: exercise.tags ?? [],
    instructions: exercise.instructions ?? [],
    tips: exercise.tips ?? [],
    isBodyweight: Boolean(exercise.is_bodyweight),
    isUnilateral: Boolean(exercise.is_unilateral),
    met: exercise.met ?? null,
    slug: exercise.slug ?? "",
    isCustom: Boolean(exercise.isCustom),
    createdAt: exercise.createdAt ?? null,
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
      // Tenant visibility boundary: library rows or rows owned by this gym.
      // Seeded exercises do not store `isCustom` at all, so compare against true
      // instead of false; otherwise the whole catalog is hidden.
      {
        $or: [
          { isCustom: { $ne: true } },
          { createdByGymId: req.user.gymId ?? null },
        ],
      },
    ];

    const search = String(req.query.search ?? "").trim();

    // A separate $or is required because combining visibility and search in one
    // $or would let search terms bypass the tenant boundary.
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");

      filters.push({
        $or: [
          { title: pattern },
          { name: pattern },
          { primaryMuscle: pattern },
          { body_part: pattern },
          { secondaryMuscles: pattern },
          { "targetMuscles.primary": pattern },
          { "targetMuscles.secondary": pattern },
          { equipment: pattern },
          { category: pattern },
        ],
      });
    }

    const exercises = await Exercise.find({ $and: filters })
      .sort({ title: 1, name: 1 })
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

    // Case-insensitive exact-name check across both storage shapes gives a
    // friendlier 409 than relying on a unique index.
    const duplicateName = new RegExp(`^${escapeRegex(name)}$`, "i");
    const existing = await Exercise.findOne({
      $or: [{ title: duplicateName }, { name: duplicateName }],
    }).lean();

    if (existing) {
      return res
        .status(409)
        .json({ message: "An exercise with this name already exists." });
    }

    // Populate both shapes so custom rows behave like library rows while older
    // routine/progress code can still read name/primaryMuscle.
    const exercise = await Exercise.create({
      title: name,
      name,
      primaryMuscle,
      body_part: primaryMuscle,
      secondaryMuscles,
      targetMuscles: {
        primary: [primaryMuscle],
        secondary: secondaryMuscles,
      },
      description: String(req.body.description ?? "").trim(),
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
