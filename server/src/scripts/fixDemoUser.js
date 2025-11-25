import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import path from 'path';
import { fileURLToPath } from 'url';

// Ensure we load the server/.env regardless of current working directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const FIX_EMAIL = 'demo@devboard.local';
const FIX_PASSWORD = 'password123';

const run = async () => {
  try {
    await connectDB();
    const user = await User.findOne({ email: FIX_EMAIL });
    if (!user) {
      console.log('No demo user found to fix.');
      process.exit(0);
    }

    // If user already has passwordHash, show info and exit
    if (user.passwordHash) {
      console.log('User already has passwordHash set. Nothing to do.');
      console.log('User id:', user._id.toString());
      process.exit(0);
    }

    const hash = await bcrypt.hash(FIX_PASSWORD, 10);
    user.passwordHash = hash;
    await user.save();
    console.log('Updated demo user passwordHash.');
    console.log('Email:', user.email);
    console.log('User id:', user._id.toString());
    process.exit(0);
  } catch (err) {
    console.error('Error fixing demo user:', err);
    process.exit(1);
  }
};

run();
