import express from "express";
import Snippet from "../models/Snippet.js";
import Note from "../models/Note.js";
import Tag from "../models/Tag.js";
import Project from "../models/Project.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.use(requireAuth);

const normalize = (value) => String(value || "").trim();

// GET /api/tags - list tags (stored tags + usage counts)
router.get("/", async (req, res) => {
  try {
    const userId = req.userId;

    const [snippetTags, noteTags, projectTags, storedTags] = await Promise.all([
      Snippet.aggregate([
        { $match: { user: userId, tags: { $exists: true, $ne: [] } } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
      ]),
      Note.aggregate([
        { $match: { user: userId, tags: { $exists: true, $ne: [] } } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
      ]),
      Project.aggregate([
        { $match: { user: userId, tags: { $exists: true, $ne: [] } } },
        { $unwind: "$tags" },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
      ]),
      Tag.find({ user: userId }).sort({ name: 1 }).lean(),
    ]);

    const counts = new Map();
    for (const item of snippetTags) {
      const name = normalize(item._id);
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + (item.count || 0));
    }
    for (const item of noteTags) {
      const name = normalize(item._id);
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + (item.count || 0));
    }
    for (const item of projectTags) {
      const name = normalize(item._id);
      if (!name) continue;
      counts.set(name, (counts.get(name) || 0) + (item.count || 0));
    }

    const stored = storedTags.map((tag) => ({
      name: normalize(tag.name),
      color: tag.color || undefined,
      count: counts.get(normalize(tag.name)) || 0,
    }));

    // include any tags that exist in usage but not stored
    for (const [name, count] of counts.entries()) {
      if (!stored.find((t) => t.name === name)) {
        stored.push({ name, count, color: undefined });
      }
    }

    stored.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    res.json({ items: stored, total: stored.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/tags - create a tag
router.post("/", async (req, res) => {
  try {
    const name = normalize(req.body?.name);
    const color = normalize(req.body?.color) || undefined;
    if (!name) return res.status(400).json({ message: "Missing name" });

    const existing = await Tag.findOne({ user: req.userId, name });
    if (existing) return res.status(409).json({ message: "Tag already exists" });

    const tag = await Tag.create({ user: req.userId, name, color });
    res.status(201).json({ name: tag.name, color: tag.color, count: 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/tags/rename - rename a tag across snippets and notes
router.put("/rename", async (req, res) => {
  try {
    const from = normalize(req.body?.from);
    const to = normalize(req.body?.to);
    if (!from || !to) return res.status(400).json({ message: "Missing from/to" });

    if (from === to) return res.json({ message: "No change" });

    const conflict = await Tag.findOne({ user: req.userId, name: to });
    if (conflict) return res.status(409).json({ message: "Tag already exists" });

    await Promise.all([
      Snippet.updateMany(
        { user: req.userId, tags: from },
        { $set: { "tags.$[elem]": to } },
        { arrayFilters: [{ elem: from }] }
      ),
      Note.updateMany(
        { user: req.userId, tags: from },
        { $set: { "tags.$[elem]": to } },
        { arrayFilters: [{ elem: from }] }
      ),
      Project.updateMany(
        { user: req.userId, tags: from },
        { $set: { "tags.$[elem]": to } },
        { arrayFilters: [{ elem: from }] }
      ),
      Tag.updateOne({ user: req.userId, name: from }, { $set: { name: to } }),
    ]);

    res.json({ message: "Renamed" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/tags/:name - remove a tag from snippets and notes + delete tag
router.delete("/:name", async (req, res) => {
  try {
    const name = normalize(decodeURIComponent(req.params.name || ""));
    if (!name) return res.status(400).json({ message: "Missing tag" });

    await Promise.all([
      Snippet.updateMany(
        { user: req.userId, tags: name },
        { $pull: { tags: name } }
      ),
      Note.updateMany(
        { user: req.userId, tags: name },
        { $pull: { tags: name } }
      ),
      Project.updateMany(
        { user: req.userId, tags: name },
        { $pull: { tags: name } }
      ),
      Tag.deleteOne({ user: req.userId, name }),
    ]);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
