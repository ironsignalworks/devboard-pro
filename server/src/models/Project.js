import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["active", "completed", "archived"], default: "active" },
    tags: { type: [String], default: [] },
    preferredLanguage: { type: String },
    snippetsCount: { type: Number, default: 0 },
    notesCount: { type: Number, default: 0 },
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
export default Project;
