/**
 * Flexity API entry point.
 *
 * Responsibilities:
 * - Loads server/.env and fails fast when required configuration is missing.
 * - Configures CORS, JSON parsing, and optional proxy trust.
 * - Lazily opens a single shared MongoDB connection and gates API routers on it.
 * - Mounts all /api routers and translates known errors into consistent responses.
 *
 * Invariants:
 * - MONGO_URI and JWT_SECRET must be present; startup aborts otherwise.
 * - CORS allows credentials, so only explicitly listed origins are permitted.
 * - A router only receives a request after the database is ready (ensureDatabase).
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import setupRoutes from "./routes/setupRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import gymRoutes from "./routes/gymRoutes.js";
import exerciseRoutes from "./routes/exerciseRoutes.js";
import routineRoutes from "./routes/routineRoutes.js";
import coachRoutes from "./routes/coachRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const mongoUri = process.env.MONGO_URI;
const port = Number(process.env.PORT || 5000);

if (!mongoUri) {
  throw new Error("MONGO_URI must be configured in server/.env");
}

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET must be configured in server/.env");
}

// CLIENT_URL supports a comma-separated allowlist so multiple front-end origins
// (for example local dev plus production) can share one deployment.
const allowedOrigins = (process.env.CLIENT_URL || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();

// Behind a reverse proxy, Express must be told how many hops to trust or req.ip
// (and therefore the in-memory rate-limit keys) becomes the proxy's address.
const trustProxy = String(process.env.TRUST_PROXY ?? "").trim();

if (trustProxy) {
  const hops = Number(trustProxy);

  app.set(
    "trust proxy",
    Number.isInteger(hops) && hops > 0 ? hops : 1
  );
}

// Credentialed CORS cannot use a wildcard origin, so unknown origins are rejected
// by omitting the Access-Control-Allow-Origin header. Same-origin/no-Origin
// requests (server-to-server, curl) are allowed through.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  })
);

// Cap request bodies to limit memory pressure from oversized JSON payloads.
app.use(express.json({ limit: "1mb" }));

let connectionPromise;

/**
 * Returns the cached MongoDB connection, creating it on first use.
 *
 * Reusing one promise prevents concurrent requests (and the startup call) from
 * opening multiple connections. On failure the promise is cleared so a later
 * request can retry instead of being permanently stuck with a rejected promise.
 *
 * @returns {Promise<typeof mongoose>} Resolved Mongoose connection.
 */
function connectToDatabase() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoUri, { serverSelectionTimeoutMS: 10000 })
      .catch((error) => {
        connectionPromise = undefined;
        throw error;
      });
  }

  return connectionPromise;
}

/**
 * Express middleware that guarantees a live database connection before a route
 * runs. Failures are tagged as 503 so the centralized error handler can report a
 * temporary outage rather than an internal bug.
 *
 * @param {import("express").Request} _req
 * @param {import("express").Response} _res
 * @param {import("express").NextFunction} next
 */
async function ensureDatabase(_req, _res, next) {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    error.status = 503;
    next(error);
  }
}

app.get("/", (_req, res) => {
  res
    .type("html")
    .send(
      "<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Flexity API</title></head><body><p>Flexity API is running.</p></body></html>"
    );
});

// Liveness probes intentionally do not require the database middleware so the
// process can report "disconnected" instead of failing the whole health check.
app.get("/api/health", (_req, res) => {
  res.json({
    ok: mongoose.connection.readyState === 1,
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// ---------------------------------------------------------------------------
// API routers. Every request that reaches a router has passed ensureDatabase.
// ---------------------------------------------------------------------------
app.use("/api/setup", ensureDatabase, setupRoutes);
app.use("/api/auth", ensureDatabase, authRoutes);
app.use("/api/gym", ensureDatabase, gymRoutes);
app.use("/api/exercises", ensureDatabase, exerciseRoutes);
app.use("/api/routines", ensureDatabase, routineRoutes);
app.use("/api/coach", ensureDatabase, coachRoutes);
app.use("/api/client", ensureDatabase, clientRoutes);

// ---------------------------------------------------------------------------
// Fallbacks: unknown routes become JSON 404s, and every thrown error is mapped
// to a stable status/message shape the front end can rely on.
// ---------------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ message: "Endpoint not found." });
});

app.use((error, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error.status === 503) {
    res.status(503).json({ message: "Database unavailable." });
    return;
  }

  if (error.code === 11000) {
    res.status(409).json({
      message: "An account or record with that email or name already exists.",
    });
    return;
  }

  if (error.name === "CastError") {
    res.status(400).json({ message: "Invalid request data." });
    return;
  }

  if (error.name === "ValidationError") {
    const first = Object.values(error.errors ?? {})[0];
    res.status(400).json({ message: first?.message || "Invalid request data." });
    return;
  }

  console.error(error);

  res
    .status(error.status || 500)
    .json({ message: error.message || "Server error." });
});

/**
 * Connects to MongoDB before listening so the first API request never races the
 * initial connection. Startup failures terminate the process: a half-ready API
 * is harder to detect than a failed boot.
 */
async function start() {
  await connectToDatabase();
  app.listen(port, () => {
    console.log(`Flexity API running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Unable to start server:", error.message);
  process.exit(1);
});
