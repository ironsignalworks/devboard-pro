import mongoose from "mongoose";

const tagSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    color: { type: String },
  },
  { timestamps: true }
);

tagSchema.index({ user: 1, name: 1 }, { unique: true });

const Tag = mongoose.model("Tag", tagSchema);
export default Tag;
