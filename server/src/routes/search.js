import express from "express";
import Snippet from "../models/Snippet.js";
import Note from "../models/Note.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

// GET /api/search?q=term&type=all|snippets|notes|projects
router.get("/", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim();
    const type = String(req.query.type || "all");
    if (!q) return res.json({ items: [] });

    const user = req.userId;
    const regex = { $regex: q, $options: "i" };

    const tasks = [];
    if (type === "all" || type === "snippets") {
      tasks.push(
        Snippet.find({ user, $or: [{ title: regex }, { description: regex }, { code: regex }, { tags: regex }] })
          .sort({ updatedAt: -1 })
          .limit(10)
          .lean()
          .then((items) => items.map((item) => ({
            type: "snippet",
            id: item._id,
            title: item.title,
            description: item.description || "",
            updatedAt: item.updatedAt,
            tags: item.tags || [],
          })))
      );
    }
    if (type === "all" || type === "notes") {
      tasks.push(
        Note.find({ user, $or: [{ title: regex }, { content: regex }, { tags: regex }] })
          .sort({ updatedAt: -1 })
          .limit(10)
          .lean()
          .then((items) => items.map((item) => ({
            type: "note",
            id: item._id,
            title: item.title,
            description: item.content || "",
            updatedAt: item.updatedAt,
            tags: item.tags || [],
          })))
      );
    }
    if (type === "all" || type === "projects") {
      tasks.push(
        Project.find({ user, $or: [{ title: regex }, { description: regex }, { tags: regex }] })
          .sort({ updatedAt: -1 })
          .limit(10)
          .lean()
          .then((items) => items.map((item) => ({
            type: "project",
            id: item._id,
            title: item.title,
            description: item.description || "",
            updatedAt: item.updatedAt,
            tags: item.tags || [],
          })))
      );
    }

    const results = (await Promise.all(tasks)).flat();
    results.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));

    res.json({ items: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
