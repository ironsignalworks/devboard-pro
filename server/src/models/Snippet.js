import mongoose from "mongoose";

const snippetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: { type: String },
    code: { type: String, default: "" },
    language: { type: String },
    tags: [{ type: String }],
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  },
  { timestamps: true }
);

// Text index for search over title, description and code
snippetSchema.index({ title: "text", description: "text", code: "text" });

const Snippet = mongoose.model("Snippet", snippetSchema);
export default Snippet;
