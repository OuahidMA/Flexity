/**
 * Per-client workout progress log.
 *
 * A log is one exercise performed on one date by one client, with one entry per
 * set. Clients are embedded on the gym admin User; clientId therefore refers to
 * the embedded subdocument's _id, while gymId is denormalized here so tenant
 * filtering does not require loading the admin.
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
    weight: { type: Number, required: true },
    reps: { type: Number, required: true },
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

const ProgressLog = mongoose.model("ProgressLog", progressLogSchema);

export default ProgressLog;
