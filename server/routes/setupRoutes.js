/**
 * First-run bootstrap routes.
 *
 * `/status` lets the front end decide between the setup wizard and login.
 * `POST /` creates the first gym + gym_admin, but only while no gym_admin exists
 * anywhere; afterward it returns 409. This makes the endpoint self-disabling
 * without needing a separate environment flag.
 *
 * The gym is deleted if admin creation fails so a failed bootstrap never leaves
 * an orphan tenant that would block a retry.
 */

import { Router } from "express";
import Gym from "../models/Gym.js";
import User from "../models/User.js";
import {
  buildSession,
  normalizeEmail,
  toClientSession,
} from "../utils/session.js";
import { setSessionCookie } from "../utils/cookies.js";
import {
  clientIp,
  createRateLimiter,
} from "../middleware/rateLimit.js";

const router = Router();

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Throttle per IP because bootstrap is unauthenticated.
const setupLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 20,
  keyGenerator: clientIp,
  message: "Too many setup attempts. Please try again later.",
});

/**
 * Validates bootstrap input.
 *
 * @param {object} body
 * @returns {string|null} First validation message, or null when valid.
 */
function validateBootstrap(body) {
  const businessName = String(body.businessName ?? "").trim();
  const name = String(body.name ?? "").trim();
  const email = normalizeEmail(body.email);
  const password = String(body.password ?? "");

  if (!businessName) return "Gym name is required.";
  if (!name) return "Your name is required.";
  if (!EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  if (password.length < 8) return "Password must be at least 8 characters.";

  return null;
}

/**
 * Picks only recognized, non-empty branding strings so arbitrary body keys are
 * never persisted into the embedded branding object.
 *
 * @param {object} body
 * @returns {object} Partial branding object (possibly empty).
 */
function brandingFrom(body) {
  const branding = {};

  for (const key of ["logoUrl", "primaryColor", "secondaryColor", "accentColor"]) {
    if (typeof body[key] === "string" && body[key].trim()) {
      branding[key] = body[key].trim();
    }
  }

  return branding;
}

// ---------------------------------------------------------------------------
// GET /api/setup/status - has the platform been bootstrapped?
// ---------------------------------------------------------------------------
router.get("/status", async (_req, res) => {
  const initialized = Boolean(await User.exists({ role: "gym_admin" }));
  res.json({ initialized });
});

// ---------------------------------------------------------------------------
// POST /api/setup - create the first gym and gym_admin, then sign them in
// ---------------------------------------------------------------------------
router.post("/", setupLimiter, async (req, res, next) => {
  try {
    // Re-checked inside the handler (not just via UI state) because the status
    // endpoint is advisory and can be stale.
    const initialized = Boolean(await User.exists({ role: "gym_admin" }));

    if (initialized) {
      return res.status(409).json({
        success: false,
        code: "ALREADY_INITIALIZED",
        message:
          "This platform has already been set up. Please sign in with your gym admin account.",
      });
    }

    const problem = validateBootstrap(req.body);

    if (problem) {
      return res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: problem,
      });
    }

    const gym = await Gym.create({
      businessName: String(req.body.businessName).trim(),
      subscriptionStatus: "active",
      branding: brandingFrom(req.body),
    });

    let user;

    try {
      user = await User.create({
        gymId: gym._id,
        email: normalizeEmail(req.body.email),
        password: String(req.body.password),
        role: "gym_admin",
        profile: { name: String(req.body.name).trim() },
      });
    } catch (error) {
      // Compensating delete: without an admin the gym would be unreachable and
      // would still block setup, so roll it back best-effort.
      await Gym.findByIdAndDelete(gym._id).catch(() => {});
      throw error;
    }

    // Auto-login the bootstrap admin so setup ends on a usable session.
    const session = await buildSession(user);

    setSessionCookie(res, session.token);

    return res.status(201).json(toClientSession(session));
  } catch (error) {
    return next(error);
  }
});

export default router;
