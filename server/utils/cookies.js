/**
 * Session cookie helpers.
 *
 * The JWT is stored in an httpOnly cookie so browser JavaScript cannot read it
 * (mitigating XSS token theft). Attributes are derived from configuration:
 * - SameSite defaults to "lax"; "none" is allowed for cross-site front ends but
 *   forces Secure, which browsers require.
 * - Secure is also forced in production.
 *
 * `readCookie` parses only the named cookie and safely handles malformed
 * percent-encoding.
 */

export const SESSION_COOKIE_NAME = "flexity_session";
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Resolves COOKIE_SAME_SITE, falling back to "lax" for unset/invalid values.
 *
 * @returns {"strict"|"lax"|"none"}
 */
function resolveSameSite() {
  const value = String(process.env.COOKIE_SAME_SITE ?? "")
    .trim()
    .toLowerCase();

  if (value === "strict" || value === "lax" || value === "none") {
    return value;
  }

  return "lax";
}

/**
 * Attributes shared by set and clear operations. Non-browser clients may still
 * use the Bearer fallback in middleware/auth.js.
 *
 * @returns {import("express").CookieOptions}
 */
export function sessionCookieOptions() {
  const sameSite = resolveSameSite();

  return {
    httpOnly: true,
    secure: sameSite === "none" || process.env.NODE_ENV === "production",
    sameSite,
    path: "/",
    maxAge: SESSION_MAX_AGE_MS,
    priority: "high",
  };
}

/**
 * Writes the session JWT to the httpOnly cookie.
 *
 * @param {import("express").Response} res
 * @param {string} token Signed JWT.
 */
export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions());
}

/**
 * Expires the session cookie. maxAge/priority are omitted because clearCookie
 * only needs the matching scope attributes (path, sameSite, secure).
 *
 * @param {import("express").Response} res
 */
export function clearSessionCookie(res) {
  const { maxAge: _maxAge, priority: _priority, ...options } =
    sessionCookieOptions();

  res.clearCookie(SESSION_COOKIE_NAME, options);
}

/**
 * Reads one cookie value from the Cookie header.
 *
 * @param {import("express").Request} req
 * @param {string} name Exact cookie name.
 * @returns {string|null} Decoded value, or null when absent/undecodable.
 */
export function readCookie(req, name) {
  const header = req.headers.cookie;

  if (!header) return null;

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");

    if (separator === -1) continue;

    if (part.slice(0, separator).trim() !== name) continue;

    const value = part.slice(separator + 1).trim();

    try {
      return decodeURIComponent(value);
    } catch {
      return null;
    }
  }

  return null;
}
