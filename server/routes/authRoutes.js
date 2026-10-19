/**
 * Authentication routes: login, logout, and session refresh.
 *
 * Login resolves an email to either a top-level User (super_admin/gym_admin) or
 * an embedded coach/client subdocument, verifies the password, and issues a JWT
 * plus the httpOnly `flexity_session` cookie. The token payload contains
 * userId/gymId/role/sessionVersion.
 *
 * `/me` intentionally re-validates sessionVersion and active status so a token
 * revoked by a password/email change or deactivation stops working even though
 * its JWT signature is still valid.
 */

import { Router } from "express";
import mongoose from "mongoose";
import User from "../models/User.js";
import auth from "../middleware/auth.js";
import {
  clearSessionCookie,
  setSessionCookie,
} from "../utils/cookies.js";
import {
  buildSession,
  normalizeEmail,
  toClientSession,
} from "../utils/session.js";
import {
  findAccountByEmail,
  findEmbeddedMemberById,
} from "../utils/members.js";
import {
  clientIp,
  createRateLimiter,
} from "../middleware/rateLimit.js";

const router = Router();

const LOGIN_WINDOW_MS = 15 * 60 * 1000;

// Two independent limits: one per network to blunt distributed guessing, and a
// tighter one per IP+email pair to protect a single account from brute force.
const loginIpLimiter = createRateLimiter({
  windowMs: LOGIN_WINDOW_MS,
  max: 50,
  keyGenerator: clientIp,
  message: "Too many sign-in attempts from this network. Please try again later.",
});

const loginAccountLimiter = createRateLimiter({
  windowMs: LOGIN_WINDOW_MS,
  max: 10,
  keyGenerator(req) {
    const email = normalizeEmail(req.body?.email);

    // Returning null skips limiting for requests without an email; the IP
    // limiter still applies.
    return email ? `${clientIp(req)}:${email}` : null;
  },
  message: "Too many sign-in attempts for this account. Please try again later.",
});

/** 401 for a validly signed token whose stored sessionVersion has moved on. */
function sendSessionRevoked(res) {
  return res.status(401).json({
    success: false,
    code: "SESSION_REVOKED",
    message: "Your session is no longer valid. Please sign in again.",
  });
}

/** 403 for a correct password on a deactivated account. */
function sendAccountInactive(res) {
  return res.status(403).json({
    success: false,
    code: "ACCOUNT_INACTIVE",
    message:
      "This account has been deactivated. Please contact your gym administrator.",
  });
}

/**
 * Compares the account's current sessionVersion with the token's copy.
 *
 * @param {{ sessionVersion?: number }} account
 * @param {{ sessionVersion?: number }} token
 * @returns {boolean}
 */
function sessionMatches(account, token) {
  return (
    Number(account?.sessionVersion ?? 0) ===
    Number(token.sessionVersion ?? 0)
  );
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
router.post(
  "/login",
  loginIpLimiter,
  loginAccountLimiter,
  async (req, res, next) => {
    try {
      const email = normalizeEmail(req.body.email);
      const password = String(req.body.password ?? "");
      // Optional gym disambiguation for users whose email might exist elsewhere.
      const gymId = String(req.body.gymId ?? "").trim();

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: "Email and password are required.",
        });
      }

      // Searches top-level users first, then embedded members across gym admins.
      const account = await findAccountByEmail(email);

      // Same generic response for unknown email and wrong password so the route
      // does not reveal whether an account exists.
      if (!account) {
        return res.status(401).json({
          success: false,
          code: "INVALID_CREDENTIALS",
          message: "Incorrect email or password.",
        });
      }

      const matches = await account.user.comparePassword(password);

      if (!matches) {
        return res.status(401).json({
          success: false,
          code: "INVALID_CREDENTIALS",
          message: "Incorrect email or password.",
        });
      }

      if (account.user.profile?.isActive === false) {
        return sendAccountInactive(res);
      }

      const accountGymId = account.gymId ? String(account.gymId) : "";

      // When the client supplies a gymId, enforce it as an additional tenant
      // check; omitted gymId preserves the simple email/password flow.
      if (gymId) {
        if (
          !mongoose.isValidObjectId(gymId) ||
          accountGymId !== String(gymId)
        ) {
          return res.status(401).json({
            success: false,
            code: "INVALID_GYM",
            message: "This account does not belong to the specified gym.",
          });
        }
      }

      // Embedded members do not carry gymId themselves, so inject the owner
      // admin's gymId before signing the token.
      const session = account.embedded
        ? await buildSession(
            { ...account.user.toObject(), gymId: account.gymId },
            account.gymId
          )
        : await buildSession(account.user);

      setSessionCookie(res, session.token);

      // The raw token is never returned in the body; it lives in the httpOnly
      // cookie. toClientSession strips it from the response payload.
      return res.json(toClientSession(session));
    } catch (error) {
      return next(error);
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------
router.post("/logout", (_req, res) => {
  clearSessionCookie(res);

  return res.json({ success: true });
});

// ---------------------------------------------------------------------------
// GET /api/auth/me - refresh the session payload for an existing token
// ---------------------------------------------------------------------------
router.get("/me", auth, async (req, res, next) => {
  try {
    // Re-read embedded members from the owning admin so deleted/deactivated
    // accounts and bumped session versions are detected immediately.
    if (req.user.role === "coach" || req.user.role === "client") {
      const account = await findEmbeddedMemberById(req.user.userId);

      if (!account || account.user.role !== req.user.role) {
        return res.status(401).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "Your account could not be found. Please sign in again.",
        });
      }

      if (
        req.user.gymId &&
        String(account.gymId) !== String(req.user.gymId)
      ) {
        return res.status(401).json({
          success: false,
          code: "USER_NOT_FOUND",
          message: "Your account could not be found. Please sign in again.",
        });
      }

      if (!sessionMatches(account.user, req.user)) {
        return sendSessionRevoked(res);
      }

      if (account.user.profile?.isActive === false) {
        return sendAccountInactive(res);
      }

      return res.json(
        toClientSession(
          await buildSession(
            { ...account.user.toObject(), gymId: account.gymId },
            account.gymId
          )
        )
      );
    }

    // Top-level users (super_admin/gym_admin) are stored as standalone docs.
    const user = await User.findById(req.user.userId);

    if (!user || user.role !== req.user.role) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "Your account could not be found. Please sign in again.",
      });
    }

    if (
      req.user.gymId &&
      String(user.gymId ?? "") !== String(req.user.gymId)
    ) {
      return res.status(401).json({
        success: false,
        code: "USER_NOT_FOUND",
        message: "Your account could not be found. Please sign in again.",
      });
    }

    if (!sessionMatches(user, req.user)) {
      return sendSessionRevoked(res);
    }

    if (user.profile?.isActive === false) {
      return sendAccountInactive(res);
    }

    return res.json(toClientSession(await buildSession(user)));
  } catch (error) {
    return next(error);
  }
});

export default router;
