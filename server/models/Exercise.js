/**
 * Exercise catalog model.
 *
 * The catalog has two tiers:
 * - Shared/default exercises (`isCustom: false`) visible to every gym.
 * - Gym-specific exercises (`isCustom: true`) visible only to the gym in
 *   `createdByGymId`.
 *
 * Queries must apply that visibility rule themselves (see exerciseRoutes.js).
 * Exercise names are globally unique, so a custom exercise cannot reuse a
 * default name. Muscle fields are denormalized onto routines for display.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

const exerciseSchema = new Schema(
  {
    // ---------------------------------------------------------------------
    // Catalog identity and classification
    // ---------------------------------------------------------------------
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    primaryMuscle: {
      type: String,
      required: true,
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

// Compound index supports the common "shared OR owned by this gym" filter.
exerciseSchema.index({ isCustom: 1, createdByGymId: 1 });
// Text index backs catalog search (the routes also do escaped regex matching).
exerciseSchema.index({
  name: "text",
  primaryMuscle: "text",
  secondaryMuscles: "text",
});

const Exercise = mongoose.model("Exercise", exerciseSchema);

export default Exercise;
