/**
 * Workout routine model.
 *
 * A routine is authored by a coach within one gym and may optionally be assigned
 * to a client. Each exercise line stores a snapshot of the catalog exercise
 * (name and primary muscle) so the routine stays readable if the catalog entry
 * is later renamed or removed.
 *
 * routineCode is a short, human-shareable public identifier. It is optional
 * (older routines may lack one), unique when present, and is mirrored into the
 * assigned client's embedded `workoutRoutines` list as `routineId`.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// Embedded exercise line. `_id: false` avoids pointless ids because lines are
// always replaced as a whole when a routine is edited.
const routineExerciseSchema = new Schema(
  {
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    primaryMuscle: {
      type: String,
      default: "",
      trim: true,
    },
    sets: {
      type: Number,
      default: 3,
      min: 1,
    },
    reps: {
      type: Number,
      default: 10,
      min: 1,
    },
    restSec: {
      type: Number,
      default: 60,
      min: 0,
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const routineSchema = new Schema(
  {
    // ---------------------------------------------------------------------
    // Ownership: gym, authoring coach, optional assigned client
    // ---------------------------------------------------------------------
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },
    coachId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    routineCode: {
      type: String,
      trim: true,
      uppercase: true,
      // undefined (not null) so the sparse unique index ignores code-less
      // routines instead of treating every null as a duplicate.
      default: undefined,
    },
    // ---------------------------------------------------------------------
    // Presentation and lifecycle
    // ---------------------------------------------------------------------
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    goal: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
      index: true,
    },
    // ---------------------------------------------------------------------
    // Ordered exercise lines snapshotted from the catalog
    // ---------------------------------------------------------------------
    exercises: {
      type: [routineExerciseSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Coach dashboard listing, newest edited first.
routineSchema.index({ gymId: 1, coachId: 1, updatedAt: -1 });
// Client lookup by gym/assignment/status.
routineSchema.index({ gymId: 1, clientId: 1, status: 1 });
// Sparse unique so multiple routines without a code are allowed.
routineSchema.index({ routineCode: 1 }, { unique: true, sparse: true });

const Routine = mongoose.model("Routine", routineSchema);

export default Routine;
