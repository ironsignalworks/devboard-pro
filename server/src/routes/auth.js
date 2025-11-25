import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    console.log('Auth register body:', req.body);
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "changeme", {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('Auth register error:', err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    console.log('Auth login body:', req.body);
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Missing fields' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Support both `passwordHash` and legacy `password` fields
    const hashed = user.passwordHash ?? user.password;
    if (!hashed) {
      console.error('Auth login error: no password hash stored for user', user._id);
      return res.status(500).json({ message: 'Server error' });
    }

    const isMatch = await bcrypt.compare(password, hashed);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || "changeme", {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error('Auth login error:', err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
