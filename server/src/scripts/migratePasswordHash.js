import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load server .env reliably
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const run = async () => {
  try {
    await connectDB();
    console.log('Connected to DB. Starting migration...');

    const users = await User.find({ $or: [{ password: { $exists: true } }, { passwordHash: { $exists: false } }] });
    console.log(`Found ${users.length} users to inspect`);

    let updated = 0;
    for (const u of users) {
      if (u.passwordHash) continue; // already migrated
      if (u.password) {
        const hash = await bcrypt.hash(u.password, 10);
        u.passwordHash = hash;
        await u.save();
        updated++;
        console.log(`Updated user ${u.email}`);
      }
    }

    console.log(`Migration finished. Updated ${updated} users`);
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}

run();
