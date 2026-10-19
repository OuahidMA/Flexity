/**
 * User model.
 *
 * Two storage shapes share this model:
 * - Top-level users: super_admin and gym_admin. They have credentials directly
 *   on the User document and a gymId (except super_admin).
 * - Embedded members: coaches and clients. They are subdocuments inside their
 *   gym admin's `coaches` / `clients` arrays, so one admin document owns all
 *   tenant members. This keeps tenant reads/writes atomic but means login and
 *   account lookup must search inside gym admin documents
 *   (see utils/members.js).
 *
 * Cross-cutting invariants:
 * - Passwords are hashed by pre-save hooks on every schema shape. Because the
 *   hook is per-subdocument, saving the admin also hashes newly pushed members.
 * - sessionVersion is bumped on password/email change or deactivation; tokens
 *   carry the old value and checkAccess rejects them.
 * - Password and __v are stripped by JSON/object transforms, including for
 *   embedded members.
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

// Shared profile fields. `_id: false` because the parent user/subdocument owns
// identity; profiles are value objects.
const profileSchema = new Schema(
  {
    name: { type: String, trim: true, default: "" },
    speciality: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Pre-save hook: re-hash the password only when it actually changed.
 *
 * Uses cost 12 and is shared by the top-level, coach, and client schemas. The
 * `isModified` guard prevents a second hash when an unrelated field (profile,
 * sessionVersion) is updated.
 */
async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 12);
}

/**
 * Instance method used by the login route. bcrypt.compare is timing-safe.
 *
 * @param {string} candidatePassword Plain-text password from the request.
 * @returns {Promise<boolean>}
 */
function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
}

// ---------------------------------------------------------------------------
// Embedded coach subdocument
// ---------------------------------------------------------------------------
const coachSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "coach",
      enum: ["coach"],
      required: true,
    },
    profile: {
      type: profileSchema,
      default: () => ({}),
    },
    sessionVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Lightweight routine reference stored on the client so their workout list can
// be rendered without loading the Routine collection. routineId is the routine's
// routineCode, not its Mongo _id.
const workoutRoutineSchema = new Schema(
  {
    routineId: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Embedded client subdocument
// ---------------------------------------------------------------------------
const clientSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      default: "client",
      enum: ["client"],
      required: true,
    },
    coachId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    profile: {
      type: profileSchema,
      default: () => ({}),
    },
    workoutRoutines: {
      type: [workoutRoutineSchema],
      default: [],
    },
    sessionVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Register hashing and password comparison for every shape that can log in.
coachSchema.pre("save", hashPassword);
coachSchema.methods.comparePassword = comparePassword;

clientSchema.pre("save", hashPassword);
clientSchema.methods.comparePassword = comparePassword;

/**
 * Removes credentials and Mongoose internals from a serialized document.
 *
 * Mutates `ret` in place because Mongoose transforms expect the returned object.
 *
 * @param {object} _doc Original document (unused).
 * @param {object} ret Plain object about to be serialized.
 * @returns {object} The same `ret`, sanitized.
 */
function stripPassword(_doc, ret) {
  delete ret.password;
  delete ret.__v;
  return ret;
}

// ---------------------------------------------------------------------------
// Top-level user (super_admin / gym_admin) with embedded members
// ---------------------------------------------------------------------------
const userSchema = new Schema(
  {
    // ---------------------------------------------------------------------
    // Tenant scope and identity
    // ---------------------------------------------------------------------
    gymId: {
      type: Schema.Types.ObjectId,
      ref: "Gym",
      default: null,
      required: function requireGymForTenantRoles() {
        // Platform super_admins are intentionally not tied to a gym.
        return this.role !== "super_admin";
      },
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["super_admin", "gym_admin", "coach", "client"],
    },
    coachId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // ---------------------------------------------------------------------
    // Profile and session invalidation counter
    // ---------------------------------------------------------------------
    profile: {
      type: profileSchema,
      default: () => ({}),
    },
    sessionVersion: {
      type: Number,
      default: 0,
      min: 0,
    },
    // ---------------------------------------------------------------------
    // Embedded tenant members. Only gym_admin documents populate these arrays.
    // ---------------------------------------------------------------------
    coaches: {
      type: [coachSchema],
      default: [],
    },
    clients: {
      type: [clientSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    // Sanitize both top-level credentials and every embedded member when a
    // document is returned directly by a route.
    toJSON: {
      transform(_doc, ret) {
        stripPassword(_doc, ret);

        for (const members of [ret.coaches, ret.clients]) {
          if (Array.isArray(members)) {
            members.forEach((member) => stripPassword(_doc, member));
          }
        }

        return ret;
      },
    },
    toObject: {
      transform(_doc, ret) {
        stripPassword(_doc, ret);

        for (const members of [ret.coaches, ret.clients]) {
          if (Array.isArray(members)) {
            members.forEach((member) => stripPassword(_doc, member));
          }
        }

        return ret;
      },
    },
  }
);

// Tenant member listings and active-member counts.
userSchema.index({ gymId: 1, role: 1 });
userSchema.index({ gymId: 1, "profile.isActive": 1 });
// Embedded-member login lookup by email.
userSchema.index({ "coaches.email": 1 });
userSchema.index({ "clients.email": 1 });

userSchema.pre("save", hashPassword);

userSchema.methods.comparePassword = comparePassword;

const User = mongoose.model("User", userSchema);

export default User;
