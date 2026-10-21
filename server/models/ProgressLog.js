/**
 * Per-client workout progress log.
 *
 * A log is one exercise performed on one date by one client, with one entry per
 * set. Clients are embedded on the gym admin User; clientId therefore refers to
 * the embedded subdocument's _id, while gymId is denormalized here so tenant
 * filtering does not require loading the admin.
 *
 * Sets support both prescription modes the coach can choose: reps for strength
 * work and timeSec for intervals such as a 30-second plank. Weight is nullable
 * so "None" (bodyweight) is stored explicitly instead of as a fake zero.
 *
 * Volume is not stored; routes derive it as sum(weight * reps).
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// Individual set snapshot. `_id: false` keeps arrays compact because sets are
// always read as a whole.
const trackingSetSchema = new Schema(
  {
    setNumber: { type: Number, required: true },
    // Exactly one of these is non-zero, based on the exercise's trackingType.
    reps: { type: Number, default: 0, min: 0 },
    timeSec: { type: Number, default: 0, min: 0 },
    // Null = the client selected "None" for a bodyweight set.
    weight: { type: Number, default: null, min: 0 },
  },
  { _id: false }
);

const progressLogSchema = new Schema(
  {
    // ---------------------------------------------------------------------
    // Ownership and tenant scope
    // ---------------------------------------------------------------------
    clientId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      required: true,
      index: true,
    },
    // ---------------------------------------------------------------------
    // Session snapshot
    // ---------------------------------------------------------------------
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: "Exercise",
      required: true,
      index: true,
    },
    // Snapshot of the routine line, so coach views stay readable even if the
    // catalog entry or routine is edited later.
    routineId: {
      type: Schema.Types.ObjectId,
      ref: "Routine",
      default: null,
      index: true,
    },
    routineName: {
      type: String,
      default: "",
      trim: true,
    },
    dayOfWeek: {
      type: Number,
      default: null,
      min: 0,
      max: 6,
    },
    dayLabel: {
      type: String,
      default: "",
      trim: true,
    },
    exerciseName: {
      type: String,
      default: "",
      trim: true,
    },
    primaryMuscle: {
      type: String,
      default: "",
      trim: true,
    },
    // The exercise's position in the routine. Included in the daily upsert key
    // so a routine may repeat the same exercise on one day.
    exerciseOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    trackingType: {
      type: String,
      enum: ["reps", "time"],
      default: "reps",
    },
    trackingData: {
      type: [trackingSetSchema],
      default: [],
    },
  },
  { timestamps: true }
);

// Feed by client within a gym (most recent first).
progressLogSchema.index({ gymId: 1, clientId: 1, date: -1 });
// Per-exercise history for charts.
progressLogSchema.index({ clientId: 1, exerciseId: 1, date: -1 });
// One log per exercise line per day; used by the client's save upsert.
progressLogSchema.index({
  gymId: 1,
  clientId: 1,
  date: 1,
  routineId: 1,
  exerciseId: 1,
  exerciseOrder: 1,
});

const ProgressLog = mongoose.model("ProgressLog", progressLogSchema);

export default ProgressLog;
