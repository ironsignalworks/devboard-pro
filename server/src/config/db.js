import mongoose from "mongoose";
import dotenv from "dotenv";
import { logError, logInfo } from "./logger.js";

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logInfo("MongoDB connected");
  } catch (err) {
    logError("MongoDB connection error", err);
    process.exit(1);
  }
};

export default connectDB;
