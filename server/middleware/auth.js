/**
 * Authentication middleware.
 *
 * Accepts the session JWT from either the httpOnly `flexity_session` cookie
 * (browser flow) or an `Authorization: Bearer <token>` header (API/tooling flow).
 * A Bearer header takes precedence when both are present; otherwise the cookie
 * is used.
 *
 * On success it attaches a normalized `req.user`:
 *   { userId, gymId, role, sessionVersion }
 *
 * This middleware only verifies signature/expiry. Account existence, session
 * version, active status, and subscription state are enforced later by
 * checkAccess, which re-reads the account from the database.
 */

import jwt from "jsonwebtoken";
import {
  SESSION_COOKIE_NAME,
  readCookie,
} from "../utils/cookies.js";

/**
 * Extracts a bearer token from the Authorization header.
 *
 * @param {import("express").Request} req
 * @returns {string|null} Raw token, or null when the header is absent/malformed.
 */
function bearerToken(req) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (!token || !/^Bearer$/i.test(scheme)) return null;

  return token;
}

/**
 * Verifies the session token and exposes its claims as `req.user`.
 *
 * Missing tokens return 401 NO_TOKEN; expired or tampered tokens return 401
 * TOKEN_EXPIRED / INVALID_TOKEN. No database access happens here, so expired
 * sessions are detected cheaply before any account lookup.
 *
 * @param {import("express").Request} req
 * @param {import("express").Response} res
 * @param {import("express").NextFunction} next
 */
export function auth(req, res, next) {
  const token =
    bearerToken(req) || readCookie(req, SESSION_COOKIE_NAME);

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "NO_TOKEN",
      message: "Authentication required. Please sign in.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      gymId: decoded.gymId ?? null,
      role: decoded.role,
      sessionVersion: Number(decoded.sessionVersion ?? 0),
    };

    return next();
  } catch (error) {
    const expired = error.name === "TokenExpiredError";

    return res.status(401).json({
      success: false,
      code: expired ? "TOKEN_EXPIRED" : "INVALID_TOKEN",
      message: expired
        ? "Your session has expired. Please sign in again."
        : "Invalid authentication token.",
    });
  }
}

export default auth;
