import express from "express";
import Snippet from "../models/Snippet.js";
import Note from "../models/Note.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

const DAY_MS = 24 * 60 * 60 * 1000;

const buildDateKey = (value) =>
  `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;

// GET /api/analytics/productivity?days=7
router.get("/productivity", async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(String(req.query.days)) || 7, 1), 30);
    const user = req.userId;
    const now = new Date();
    const start = new Date(now.getTime() - (days - 1) * DAY_MS);
    start.setHours(0, 0, 0, 0);

    const [snippets, notes, projects] = await Promise.all([
      Snippet.find({ user, updatedAt: { $gte: start } }).select("updatedAt").lean(),
      Note.find({ user, updatedAt: { $gte: start } }).select("updatedAt").lean(),
      Project.find({ user, updatedAt: { $gte: start } }).select("updatedAt").lean(),
    ]);

    const counts = {};
    for (let i = 0; i < days; i += 1) {
      const date = new Date(start.getTime() + i * DAY_MS);
      counts[buildDateKey(date)] = { snippets: 0, notes: 0, projects: 0, date };
    }

    const inc = (items, field) => {
      items.forEach((item) => {
        const raw = item?.updatedAt;
        if (!raw) return;
        const date = new Date(raw);
        const key = buildDateKey(date);
        if (!counts[key]) return;
        counts[key][field] += 1;
      });
    };

    inc(snippets, "snippets");
    inc(notes, "notes");
    inc(projects, "projects");

    const series = Object.values(counts)
      .sort((a, b) => a.date - b.date)
      .map((entry) => ({
        date: entry.date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        snippets: entry.snippets,
        notes: entry.notes,
        projects: entry.projects,
      }));

    res.json({ days, series });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
