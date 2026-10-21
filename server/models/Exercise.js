/**
 * Exercise catalog model.
 *
 * One collection holds two storage shapes:
 * - Seeded library exercises identify the movement with `title` and classify it
 *   with `body_part` / `targetMuscles`.
 * - Gym-specific custom exercises created through the API also store the legacy
 *   `name` / `primaryMuscle` fields so older routine code keeps working.
 *
 * Queries must apply tenant visibility themselves (see exerciseRoutes.js):
 * library rows (where `isCustom` is missing or false) plus the caller gym's
 * custom rows. Serialization maps both shapes to one API response.
 *
 * Exercise titles are treated as unique by the routes, but the schema does not
 * enforce a unique index because the seeded library predates this model and has
 * no `name` field at all.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// Library exercises store muscle identifiers as snake_case arrays. Kept as a
// subdocument so `targetMuscles.primary` / `.secondary` queries stay indexable.
const targetMusclesSchema = new Schema(
  {
    primary: { type: [String], default: [] },
    secondary: { type: [String], default: [] },
  },
  { _id: false }
);

const exerciseSchema = new Schema(
  {
    // ---------------------------------------------------------------------
    // Library identity and classification
    // ---------------------------------------------------------------------
    title: {
      type: String,
      trim: true,
      index: true,
    },
    slug: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    instructions: {
      type: [String],
      default: [],
    },
    tips: {
      type: [String],
      default: [],
    },
    targetMuscles: {
      type: targetMusclesSchema,
      default: () => ({}),
    },
    equipment: {
      type: String,
      trim: true,
      default: "",
    },
    equipmentCategory: {
      type: String,
      trim: true,
      default: "",
    },
    media: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
    category: {
      type: String,
      trim: true,
      default: "",
    },
    force_type: {
      type: String,
      trim: true,
      default: "",
    },
    mechanic: {
      type: String,
      trim: true,
      default: "",
    },
    difficulty: {
      type: String,
      trim: true,
      default: "",
    },
    body_part: {
      type: String,
      trim: true,
      index: true,
    },
    goals: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    is_unilateral: {
      type: Boolean,
      default: false,
    },
    is_bodyweight: {
      type: Boolean,
      default: false,
    },
    met: {
      type: Number,
      default: null,
    },
    variation_group: {
      type: String,
      trim: true,
      default: "",
    },
    // ---------------------------------------------------------------------
    // Legacy/API shape used by custom exercises and older routines
    // ---------------------------------------------------------------------
    name: {
      type: String,
      trim: true,
      index: true,
    },
    primaryMuscle: {
      type: String,
      trim: true,
      index: true,
    },
    secondaryMuscles: {
      type: [String],
      default: [],
    },
    // ---------------------------------------------------------------------
    // Visibility / ownership
    // ---------------------------------------------------------------------
    isCustom: {
      type: Boolean,
      default: false,
      index: true,
    },
    createdByGymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      default: null,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound index supports the common "library OR owned by this gym" filter.
exerciseSchema.index({ isCustom: 1, createdByGymId: 1 });

const Exercise = mongoose.model("Exercise", exerciseSchema);

export default Exercise;
