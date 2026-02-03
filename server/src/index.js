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

dotenv.config();
const app = express();
app.set("trust proxy", 1);

// Log incoming requests for debugging
app.use((req, res, next) => {
  console.log('[req] %s %s origin=%s', req.method, req.originalUrl, req.headers.origin);
  next();
});

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

app.get("/", (req, res) => res.send("DevBoard API running"));
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
    const seedResult = await seedSampleData();
    console.log("Seed result:", seedResult);
    app.listen(PORT, () => console.log(`Server on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server, DB connection error:", err.message || err);
    process.exit(1);
  });
