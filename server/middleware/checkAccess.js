/**
 * Tenant/account authorization middleware.
 *
 * Must run after `auth`. It re-reads the account from MongoDB and verifies, in
 * order:
 *   1. The account still exists and still has the role carried by the token.
 *   2. The account belongs to the token's gym (tenant isolation).
 *   3. The token's sessionVersion matches the stored one. Any password, email,
 *      or deactivation change bumps sessionVersion, invalidating old tokens.
 *   4. The account profile is still active.
 *   5. For non-super-admins, the gym exists and its subscription is active and
 *      not past its expiry date.
 *
 * Coaches and clients are stored as embedded subdocuments on the gym admin
 * User document, so their lookup goes through the admin; top-level users
 * (super_admin, gym_admin) are queried directly.
 *
 * On success, `req.gym` is populated with the lean gym document for downstream
 * handlers; `req.user` remains the minimal token-derived context.
 */

import Gym from "../models/Gym.js";
import User from "../models/User.js";
import { findEmbeddedMemberById } from "../utils/members.js";

// Pending members may only call the endpoint that completes their account.
const SETUP_ALLOWED_PATHS = new Set(["/api/auth/setup-account"]);

/** 403 when a member has not finished replacing their setup PIN with credentials. */
function sendSetupRequired(res) {
  return res.status(403).json({
    success: false,
    code: "SETUP_REQUIRED",
    message: "Finish setting up your account before using the workspace.",
  });
}

/** 401 when the token points at an account that no longer exists or is mismatched. */
function sendAccountMissing(res) {
  return res.status(401).json({
    success: false,
    code: "USER_NOT_FOUND",
    message: "Your account could not be found. Please sign in again.",
  });
}

/** 401 when the stored sessionVersion differs from the token's version. */
function sendSessionRevoked(res) {
  return res.status(401).json({
    success: false,
    code: "SESSION_REVOKED",
    message: "Your session is no longer valid. Please sign in again.",
  });
}

/** 403 for a valid session whose account has been deactivated. */
function sendAccountInactive(res) {
  return res.status(403).json({
    success: false,
    code: "ACCOUNT_INACTIVE",
    message:
      "This account has been deactivated. Please contact your gym administrator.",
  });
}

/**
 * Compares stored and token session versions. Missing versions are treated as 0
 * so older accounts created before the field existed remain usable.
 *
 * @param {{ sessionVersion?: number }} account
 * @param {{ sessionVersion?: number }} token
 * @returns {boolean}
 */
function sessionMatches(account, token) {
  return Number(account?.sessionVersion ?? 0) === Number(token.sessionVersion ?? 0);
}

/**
 * Verifies account state and tenant subscription for an authenticated request.
 *
 * @param {import("express").Request} req Request with `req.user` set by auth.
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 * @returns {Promise<void>}
 */
export async function checkAccess(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "NO_USER_CONTEXT",
        message: "Authentication required. Please sign in.",
      });
    }

    if (req.user.role === "coach" || req.user.role === "client") {
      // Embedded members live under their gym admin, not in a standalone User doc.
      const account = await findEmbeddedMemberById(req.user.userId);

      if (!account || account.user.role !== req.user.role) {
        return sendAccountMissing(res);
      }

      if (
        req.user.gymId &&
        String(account.gymId) !== String(req.user.gymId)
      ) {
        return sendAccountMissing(res);
      }

      if (!sessionMatches(account.user, req.user)) {
        return sendSessionRevoked(res);
      }

      if (account.user.profile?.isActive === false) {
        return sendAccountInactive(res);
      }

      // A pending member still has a setup PIN. Block every workspace API until
      // they choose an email/password; the setup endpoint itself is exempt.
      req.setupRequired = Boolean(account.user.claimPin);

      const requestPath = req.originalUrl.split("?")[0].replace(/\/+$/, "");

      if (
        req.setupRequired &&
        !SETUP_ALLOWED_PATHS.has(requestPath || "/")
      ) {
        return sendSetupRequired(res);
      }
    } else {
      const account = await User.findById(req.user.userId).select(
        "role gymId sessionVersion profile.isActive"
      );

      if (!account || account.role !== req.user.role) {
        return sendAccountMissing(res);
      }

      if (
        req.user.gymId &&
        String(account.gymId ?? "") !== String(req.user.gymId)
      ) {
        return sendAccountMissing(res);
      }

      if (!sessionMatches(account, req.user)) {
        return sendSessionRevoked(res);
      }

      if (account.profile?.isActive === false) {
        return sendAccountInactive(res);
      }
    }

    if (req.user.role === "super_admin") {
      // Platform operators are not tied to a gym or subscription.
      return next();
    }

    if (!req.user.gymId) {
      return res.status(403).json({
        success: false,
        code: "NO_TENANT",
        message: "No organization is associated with this account.",
      });
    }

    const gym = await Gym.findById(req.user.gymId)
      .select(
        "businessName branding subscriptionStatus subscriptionExpiresAt"
      )
      .lean();

    if (!gym) {
      return res.status(403).json({
        success: false,
        code: "GYM_NOT_FOUND",
        message: "The organization linked to this account could not be found.",
      });
    }

    // Both conditions revoke access: a non-active status, or an expiry date that
    // has already passed even if the stored status was never flipped.
    const isExpired =
      gym.subscriptionExpiresAt != null &&
      new Date(gym.subscriptionExpiresAt).getTime() <= Date.now();
    const isInactive = gym.subscriptionStatus !== "active";

    if (isInactive || isExpired) {
      return res.status(403).json({
        success: false,
        code: "SUBSCRIPTION_INACTIVE",
        message:
          "This account is suspended. Please contact your gym administrator to restore access.",
        subscriptionStatus: isInactive ? gym.subscriptionStatus : "past_due",
        subscriptionExpiresAt: gym.subscriptionExpiresAt,
      });
    }

    req.gym = gym;

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      code: "ACCESS_CHECK_FAILED",
      message: "Unable to verify account access. Please try again later.",
    });
  }
}

export default checkAccess;
