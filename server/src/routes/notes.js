import express from "express";
import Note from "../models/Note.js";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

// Get notes for the authenticated user
router.get("/", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const notes = await Note.find({ user: userId }).sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a note
router.post("/", requireAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.userId;
    if (!title) return res.status(400).json({ message: "Missing title" });

    const note = new Note({ title, content, user: userId });
    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
