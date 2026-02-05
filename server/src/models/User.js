import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    isGuest: { type: Boolean, default: false },
    guestExpiresAt: { type: Date },
    verifyTokenHash: { type: String },
    verifyTokenExpires: { type: Date },
    resetTokenHash: { type: String },
    resetTokenExpires: { type: Date },
    refreshTokenHash: { type: String },
    refreshTokenExpires: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
