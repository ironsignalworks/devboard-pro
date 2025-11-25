import express from "express";
import Snippet from "../models/Snippet.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// All routes below require auth
router.use(requireAuth);

// GET /api/snippets
router.get("/", async (req, res) => {
  try {
    const { q, tag } = req.query;

    const query = { user: req.userId };

    if (tag) query.tags = tag;
    if (q) query.$text = { $search: q };

    const snippets = await Snippet.find(query).sort({ updatedAt: -1 });
    res.json(snippets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/snippets
router.post("/", async (req, res) => {
  try {
    const { title, description, code, language, tags, projectId } = req.body;

    const snippet = await Snippet.create({
      user: req.userId,
      title,
      description,
      code,
      language,
      tags,
      projectId,
    });

    res.status(201).json(snippet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/snippets/:id
router.get("/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!snippet) return res.status(404).json({ message: "Not found" });
    res.json(snippet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/snippets/:id
router.put("/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndUpdate(
      { _id: req.params.id, user: req.userId },
      req.body,
      { new: true }
    );
    if (!snippet) return res.status(404).json({ message: "Not found" });
    res.json(snippet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/snippets/:id
router.delete("/:id", async (req, res) => {
  try {
    const snippet = await Snippet.findOneAndDelete({
      _id: req.params.id,
      user: req.userId,
    });
    if (!snippet) return res.status(404).json({ message: "Not found" });
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
