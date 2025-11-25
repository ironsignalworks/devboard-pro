import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Note from "../models/Note.js";

export const seedSampleData = async () => {
  try {
    const existing = await User.findOne({ email: "demo@devboard.local" });
    if (existing) return { seeded: false, reason: "Demo user already exists" };

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("password123", salt);

    const user = new User({ name: "Demo User", email: "demo@devboard.local", passwordHash: hash });
    await user.save();

    const notes = [
      { title: "Welcome to DevBoard", content: "This is a sample note.", user: user._id },
      { title: "How to use", content: "Try creating notes and projects.", user: user._id },
    ];

    await Note.insertMany(notes);

    return { seeded: true, user: { id: user._id.toString(), email: user.email } };
  } catch (err) {
    console.error("Seeding error:", err);
    return { seeded: false, reason: err.message };
  }
};
