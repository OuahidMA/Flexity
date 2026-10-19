/**
 * Role gate for authenticated routes.
 *
 * Must run after `auth` (and usually `checkAccess`). Role membership is checked
 * against the verified token claims, so this is a cheap authorization layer;
 * account/session/subscription validity is handled by checkAccess.
 *
 * @param {...string} roles Allowed roles, e.g. requireRole("gym_admin", "coach").
 * @returns {import("express").RequestHandler}
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        code: "NO_USER_CONTEXT",
        message: "Authentication required. Please sign in.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action.",
      });
    }

    return next();
  };
}

export default requireRole;
