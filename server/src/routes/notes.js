import express from "express";
import Note from "../models/Note.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// All routes below require auth
router.use(requireAuth);

// GET /api/notes
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, q, tag, projectId } = req.query;
    const pageNum = Math.max(parseInt(String(page)) || 1, 1);
    const limitNum = Math.max(parseInt(String(limit)) || 20, 1);

    const query = { user: req.userId };
    if (tag) query.tags = String(tag);
    if (projectId) {
      const projectValue = String(projectId);
      if (projectValue === "unassigned") {
        query.$or = [
          { projectId: null },
          { projectId: { $exists: false } },
        ];
      } else {
        query.projectId = projectValue;
      }
    }
    if (q) {
      const term = String(q).trim();
      if (term) {
        const textQuery = [
          { title: { $regex: term, $options: "i" } },
          { content: { $regex: term, $options: "i" } },
        ];
        if (query.$or) {
          query.$and = [{ $or: query.$or }, { $or: textQuery }];
          delete query.$or;
        } else {
          query.$or = textQuery;
        }
      }
    }
    const total = await Note.countDocuments(query);
    const notes = await Note.find(query)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({ items: notes, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/notes
router.post("/", async (req, res) => {
  try {
    const { title, content = "", tags = [], projectId } = req.body;
    if (!title) return res.status(400).json({ message: "Missing title" });

    const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    const safeProjectId = projectId ? String(projectId) : null;
    const note = await Note.create({
      user: req.userId,
      title,
      content,
      tags: safeTags,
      projectId: safeProjectId || null,
    });

    res.status(201).json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/notes/:id
router.get("/:id", async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: "Not found" });
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/notes/:id
router.put("/:id", async (req, res) => {
  try {
    const { title, content, tags, projectId } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    if (projectId !== undefined) updates.projectId = projectId ? String(projectId) : null;

    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updates,
      { new: true }
    );

    if (!note) return res.status(404).json({ message: "Not found" });
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/notes/:id
router.delete("/:id", async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!note) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
