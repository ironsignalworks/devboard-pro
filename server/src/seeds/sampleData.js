import bcrypt from "bcryptjs";
import User from "../models/User.js";
import Note from "../models/Note.js";

const buildSampleNotes = (userId) => [
  { title: "Welcome to DevBoard Pro", content: "This is a sample note.", user: userId },
  { title: "How to use", content: "Try creating notes and projects.", user: userId },
];

export const seedSampleDataForUser = async (userId) => {
  try {
    const existing = await Note.findOne({ user: userId }).select("_id");
    if (existing) return { seeded: false, reason: "User already has notes" };
    await Note.insertMany(buildSampleNotes(userId));
    return { seeded: true };
  } catch (err) {
    console.error("Seeding error:", err);
    return { seeded: false, reason: err.message };
  }
};

export const seedSampleData = async () => {
  try {
    const existing = await User.findOne({ email: "demo@devboard.local" });
    if (existing) return { seeded: false, reason: "Demo user already exists" };

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("password123", salt);

    const user = new User({
      name: "Demo User",
      email: "demo@devboard.local",
      passwordHash: hash,
      isEmailVerified: true,
    });
    await user.save();

    await Note.insertMany(buildSampleNotes(user._id));

    return { seeded: true, user: { id: user._id.toString(), email: user.email } };
  } catch (err) {
    console.error("Seeding error:", err);
    return { seeded: false, reason: err.message };
  }
};
