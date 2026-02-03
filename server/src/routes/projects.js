import express from "express";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/projects - list projects for authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, q, status, tag } = req.query;
    const pageNum = Math.max(parseInt(String(page)) || 1, 1);
    const limitNum = Math.max(parseInt(String(limit)) || 10, 1);

    const query = { user: req.userId };
    if (status && status !== "all") {
      query.status = String(status);
    }
    if (tag) {
      query.tags = String(tag);
    }
    if (q) {
      const term = String(q).trim();
      if (term) {
        query.$or = [
          { title: { $regex: term, $options: "i" } },
          { description: { $regex: term, $options: "i" } },
        ];
      }
    }
    const total = await Project.countDocuments(query);
    const projects = await Project.find(query)
      .sort({ updatedAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum);

    res.json({ items: projects, total, page: pageNum, limit: limitNum });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE project by id
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({ _id: req.params.id, user: req.userId });
    if (!project) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects - create project
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, description, status, tags, preferredLanguage } = req.body;
    if (!title) return res.status(400).json({ message: "Missing title" });
    const safeTags = Array.isArray(tags) ? tags.filter(Boolean) : [];

    const project = new Project({
      title,
      description,
      status,
      tags: safeTags,
      preferredLanguage,
      user: req.userId,
    });
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET project by id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!project) return res.status(404).json({ message: "Not found" });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT project by id
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const { title, description, status, tags, preferredLanguage } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.filter(Boolean) : [];
    if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage || null;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      updates,
      { new: true }
    );
    if (!project) return res.status(404).json({ message: "Not found" });
    res.json(project);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
