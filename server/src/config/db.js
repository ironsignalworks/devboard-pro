import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connectDB = async () => {
  try {
    console.log('DB: current working directory ->', process.cwd());
    console.log('DB: MONGO_URI present ->', Boolean(process.env.MONGO_URI));
    if (process.env.MONGO_URI) {
      const preview = process.env.MONGO_URI.slice(0, 30).replace(/([A-Za-z0-9])/g, '*');
      console.log('DB: MONGO_URI preview (masked) ->', preview);
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection error:", err.message || err);
    process.exit(1);
  }
};

export default connectDB;
