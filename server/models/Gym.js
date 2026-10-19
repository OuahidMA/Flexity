/**
 * Tenant (gym) model.
 *
 * One Gym document represents one customer organization. Users point at it via
 * gymId, and checkAccess uses `subscriptionStatus`/`subscriptionExpiresAt` to
 * gate every non-super-admin request.
 *
 * Invariants:
 * - subscriptionStatus is one of active/past_due/suspended.
 * - A date in subscriptionExpiresAt revokes access even when status is active.
 * - Branding is embedded and optional; defaults keep older gyms renderable.
 */

import mongoose from "mongoose";

const { Schema } = mongoose;

// Embedded branding avoids a join when the front end loads theme data with the
// session. `_id: false` keeps it a plain value object, not a subdocument.
const brandingSchema = new Schema(
  {
    logoUrl: { type: String, default: "" },
    primaryColor: { type: String, default: "#000000" },
    secondaryColor: { type: String, default: "#FFFFFF" },
    accentColor: { type: String, default: "#FFC000" },
  },
  { _id: false }
);

const gymSchema = new Schema(
  {
    // ---------------------------------------------------------------------
    // Identity
    // ---------------------------------------------------------------------
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    // ---------------------------------------------------------------------
    // Subscription/access state enforced by checkAccess
    // ---------------------------------------------------------------------
    subscriptionStatus: {
      type: String,
      enum: ["active", "past_due", "suspended"],
      default: "active",
      index: true,
    },
    subscriptionExpiresAt: {
      type: Date,
      default: null,
    },
    branding: {
      type: brandingSchema,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

gymSchema.index({ subscriptionStatus: 1, subscriptionExpiresAt: 1 });

const Gym = mongoose.model("Gym", gymSchema);

export default Gym;
