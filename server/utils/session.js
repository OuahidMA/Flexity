/**
 * Session/token serialization helpers.
 *
 * Tokens are signed for 7 days and carry the minimal identity needed by
 * middleware: userId, gymId, role, sessionVersion. The token is deliberately
 * not treated as authoritative: checkAccess re-reads the account and compares
 * sessionVersion so password/email/deactivation changes revoke old tokens.
 *
 * `serializeUser` strips credentials and embedded member arrays before data is
 * sent to the client; `toClientSession` removes the raw token because browsers
 * receive it via the httpOnly cookie.
 */

import jwt from "jsonwebtoken";
import Gym from "../models/Gym.js";

const JWT_EXPIRES_IN = "7d";

/**
 * Signs a JWT for a top-level user or an embedded member.
 *
 * @param {object} user User document/subdocument.
 * @param {unknown} [gymIdOverride] Required for embedded members, whose
 *   subdocuments do not store gymId.
 * @returns {string} Signed JWT.
 */
export function signToken(user, gymIdOverride) {
  const gymId = gymIdOverride ?? user.gymId;

  return jwt.sign(
    {
      userId: String(user._id),
      gymId: gymId ? String(gymId) : null,
      role: user.role,
      sessionVersion: Number(user.sessionVersion ?? 0),
    },
    process.env.JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Produces the safe user object returned to clients.
 *
 * Removes password, __v, sessionVersion (internal revocation state), and the
 * admin-only coaches/clients arrays, and normalizes ObjectId fields to strings.
 *
 * @param {object} user User document or plain object.
 * @param {unknown} [gymIdOverride]
 * @returns {object}
 */
export function serializeUser(user, gymIdOverride) {
  const raw =
    typeof user.toObject === "function" ? user.toObject() : { ...user };

  delete raw.password;
  delete raw.__v;
  delete raw.coaches;
  delete raw.clients;
  delete raw.sessionVersion;

  // A pending embedded member still has a setup PIN; expose only the derived
  // flag (never the PIN) so the client can route them to the account page.
  const setupRequired = Boolean(raw.claimPin);
  delete raw.claimPin;

  const gymId = gymIdOverride ?? raw.gymId;

  return {
    ...raw,
    id: String(raw._id),
    gymId: gymId ? String(gymId) : null,
    coachId: raw.coachId ? String(raw.coachId) : null,
    setupRequired,
  };
}

/**
 * Builds the full server-side session payload: signed token, safe user, gym
 * branding, and subscription summary. The gym lookup supplies branding and the
 * subscription fields the front end uses to show access state.
 *
 * @param {object} user User document/subdocument.
 * @param {unknown} [gymIdOverride] Required for embedded members.
 * @returns {Promise<{token: string, user: object, gymBranding: object|null, subscription: object|null}>}
 */
export async function buildSession(user, gymIdOverride) {
  const gymId = gymIdOverride ?? user.gymId;
  const gym = gymId ? await Gym.findById(gymId).lean() : null;

  return {
    token: signToken(user, gymId),
    user: serializeUser(user, gymId),
    gymBranding: gym?.branding ?? null,
    subscription: gym
      ? {
          status: gym.subscriptionStatus,
          expiresAt: gym.subscriptionExpiresAt ?? null,
        }
      : null,
  };
}

/**
 * Removes the token before sending a session in a JSON body; the browser gets it
 * through the httpOnly cookie instead.
 *
 * @param {{ token: string }} session
 * @returns {object} Session payload without `token`.
 */
export function toClientSession(session) {
  const { token: _token, ...payload } = session;

  return payload;
}

/**
 * Canonical email normalization used for storage, lookup, and rate-limit keys.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}
