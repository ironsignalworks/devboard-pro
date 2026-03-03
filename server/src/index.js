import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import notesRoutes from "./routes/notes.js";
import snippetRoutes from "./routes/snippets.js";
import projectRoutes from "./routes/projects.js";
import tagRoutes from "./routes/tags.js";
import searchRoutes from "./routes/search.js";
import activityRoutes from "./routes/activity.js";
import analyticsRoutes from "./routes/analytics.js";
import { seedSampleData } from "./seeds/sampleData.js";
import { assertSecurityConfig } from "./config/security.js";
import { logError, logInfo } from "./config/logger.js";
import mongoose from "mongoose";

dotenv.config();
const app = express();
app.set("trust proxy", 1);

// Log incoming requests in development only to reduce production noise.
if (process.env.NODE_ENV !== "production") {
  app.use((req, _res, next) => {
    logInfo("request", {
      method: req.method,
      path: req.originalUrl,
      origin: req.headers.origin || "",
    });
    next();
  });
}

// CORS: allow the app origin and send credentials for httpOnly cookies
const DEV_MODE = process.env.NODE_ENV !== "production";
const DEFAULT_DEV_ORIGIN = "http://localhost:8080";
const rawOrigins =
  process.env.CORS_ORIGIN ||
  (DEV_MODE ? DEFAULT_DEV_ORIGIN : "https://your-production-domain.com");
const allowedOrigins = rawOrigins
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.options(
  "*",
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use((req, res, next) => {
  const method = String(req.method || "GET").toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return next();

  const hasAuthCookie = Boolean(req.cookies?.accessToken);
  if (!hasAuthCookie) return next();

  const tokenCookie = req.cookies?.csrfToken;
  const tokenHeader = req.headers["x-csrf-token"];
  if (!tokenCookie || !tokenHeader || tokenCookie !== tokenHeader) {
    return res.status(403).json({ message: "Invalid CSRF token" });
  }
  return next();
});

app.get("/", (req, res) => res.send("DevBoard Pro API running"));
app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.get("/ready", (_req, res) => {
  const ready = mongoose.connection.readyState === 1;
  res.status(ready ? 200 : 503).json({ status: ready ? "ready" : "not_ready" });
});
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/snippets", snippetRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tags", tagRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/analytics", analyticsRoutes);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(async () => {
    assertSecurityConfig();
    const shouldSeed = String(process.env.SEED_DEMO_USER || "").toLowerCase() === "true";
    if (shouldSeed) {
      const seedResult = await seedSampleData();
      logInfo("Seed completed", { seedResult });
    } else {
      logInfo("Seed skipped");
    }
    app.listen(PORT, () => logInfo("Server started", { port: PORT }));
  })
  .catch((err) => {
    logError("Failed to start server", err);
    process.exit(1);
  });
