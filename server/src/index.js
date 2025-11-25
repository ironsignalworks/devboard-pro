import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import notesRoutes from "./routes/notes.js";
import snippetRoutes from "./routes/snippets.js";
import { seedSampleData } from "./seeds/sampleData.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => res.send("DevBoard API running"));
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/snippets", snippetRoutes);

const PORT = process.env.PORT || 4000;

connectDB()
  .then(async () => {
    const seedResult = await seedSampleData();
    console.log("Seed result:", seedResult);
    app.listen(PORT, () => console.log(`Server on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Failed to start server, DB connection error:", err.message || err);
    process.exit(1);
  });
