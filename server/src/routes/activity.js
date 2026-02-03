import express from "express";
import Snippet from "../models/Snippet.js";
import Note from "../models/Note.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
router.use(requireAuth);

// GET /api/activity?limit=20
router.get("/", async (req, res) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 20, 1), 100);
    const user = req.userId;

    const [snippets, notes, projects] = await Promise.all([
      Snippet.find({ user })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean(),
      Note.find({ user })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean(),
      Project.find({ user })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .lean(),
    ]);

    const mapItem = (item, type) => ({
      type,
      id: item._id,
      title: item.title,
      description: item.description || item.content || "",
      tags: item.tags || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      action: item.createdAt && item.updatedAt && item.updatedAt > item.createdAt ? "updated" : "created",
    });

    const combined = [
      ...snippets.map((item) => mapItem(item, "snippet")),
      ...notes.map((item) => mapItem(item, "note")),
      ...projects.map((item) => mapItem(item, "project")),
    ];

    combined.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    res.json({ items: combined.slice(0, limit) });
  } catch (err) {
    console.error("Activity error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
