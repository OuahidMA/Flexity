/**
 * Tenant/member lookup helpers.
 *
 * Coaches and clients are embedded subdocuments inside the gym admin's User
 * document rather than standalone users. These helpers encapsulate that layout:
 * - getGymAdmin loads the owning admin for a tenant.
 * - findAccountByEmail searches top-level users first, then embedded members.
 * - findEmbeddedMemberById locates an embedded member by subdocument id.
 * - memberNameMaps builds id -> display-name maps for serialization.
 *
 * Return objects use a consistent shape: { user, gymId, embedded, owner }, where
 * `owner` is the gym admin document (or the top-level user itself).
 */

import mongoose from "mongoose";
import User from "../models/User.js";
import { normalizeEmail } from "./session.js";

/**
 * Loads the gym admin document for a tenant.
 *
 * @param {unknown} gymId
 * @returns {Promise<object>} Mongoose User document (with embedded members).
 * @throws {Error} 404 when the tenant has no admin.
 */
export async function getGymAdmin(gymId) {
  const admin = await User.findOne({ gymId, role: "gym_admin" });

  if (!admin) {
    const error = new Error(
      "The gym administrator account could not be found."
    );
    error.status = 404;
    throw error;
  }

  return admin;
}

/**
 * Finds an embedded member in an already-loaded admin document. Coaches are
 * searched before clients; ids are unique per array, so order only matters if a
 * malformed document duplicates one.
 *
 * @param {object} admin Gym admin document.
 * @param {unknown} memberId Embedded subdocument id.
 * @returns {object|null} Matching subdocument or null.
 */
export function findMember(admin, memberId) {
  if (!admin || !memberId) return null;

  return (
    admin.coaches.find(
      (member) => String(member._id) === String(memberId)
    ) ??
    admin.clients.find(
      (member) => String(member._id) === String(memberId)
    ) ??
    null
  );
}

/**
 * Resolves a login email to either a top-level user or an embedded member.
 *
 * Top-level users are checked first, which keeps super_admin/gym_admin email
 * uniqueness authoritative. Embedded members are located by querying admins
 * whose coaches/clients arrays contain the email.
 *
 * @param {unknown} email Raw email (normalized internally).
 * @returns {Promise<{user: object, gymId: unknown, embedded: boolean, owner: object}|null>}
 */
export async function findAccountByEmail(email) {
  const normalized = normalizeEmail(email);
  const topLevel = await User.findOne({ email: normalized });

  if (topLevel) {
    return {
      user: topLevel,
      gymId: topLevel.gymId,
      embedded: false,
      owner: topLevel,
    };
  }

  const admin = await User.findOne({
    role: "gym_admin",
    $or: [{ "coaches.email": normalized }, { "clients.email": normalized }],
  });

  if (!admin) return null;

  const member = [...admin.coaches, ...admin.clients].find(
    (candidate) => candidate.email === normalized
  );

  if (!member) return null;

  return {
    user: member,
    gymId: admin.gymId,
    embedded: true,
    owner: admin,
  };
}

/**
 * Locates an embedded coach/client by subdocument id across gym admins.
 *
 * Used by auth/session middleware on every request, so it returns null for a
 * malformed id instead of throwing a CastError. The returned gymId belongs to
 * the owning admin because embedded members do not store one themselves.
 *
 * @param {unknown} memberId
 * @returns {Promise<{user: object, gymId: unknown, embedded: boolean, owner: object}|null>}
 */
export async function findEmbeddedMemberById(memberId) {
  if (!mongoose.isValidObjectId(memberId)) return null;

  const admin = await User.findOne({
    role: "gym_admin",
    $or: [{ "coaches._id": memberId }, { "clients._id": memberId }],
  });

  if (!admin) return null;

  const member = findMember(admin, memberId);

  if (!member) return null;

  return {
    user: member,
    gymId: admin.gymId,
    embedded: true,
    owner: admin,
  };
}

/**
 * Builds id -> display-name maps for coaches and clients. Names fall back to
 * email so responses never show blank assignees.
 *
 * @param {object} admin Gym admin document.
 * @returns {{ coachNames: Map<string, string>, clientNames: Map<string, string> }}
 */
export function memberNameMaps(admin) {
  return {
    coachNames: new Map(
      admin.coaches.map((coach) => [
        String(coach._id),
        coach.profile?.name || coach.email,
      ])
    ),
    clientNames: new Map(
      admin.clients.map((client) => [
        String(client._id),
        client.profile?.name || client.email,
      ])
    ),
  };
}
