import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import rateLimit from "express-rate-limit";
import User from "../models/User.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();
const normalizeEmail = (value) => String(value || "").trim().toLowerCase();
const appUrl = process.env.APP_URL || "http://localhost:8080";
const isProd = process.env.NODE_ENV === "production";

const ACCESS_TOKEN_TTL = process.env.ACCESS_TOKEN_TTL || "15m";
const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_DAYS || 7);
const VERIFY_TOKEN_TTL_MS = 1000 * 60 * 60 * 24; // 24h

const hasSmtp =
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS;

const smtpTransport = hasSmtp
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: String(process.env.SMTP_SECURE || "false") === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
});

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
};

const issueAccessToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET || "changeme", {
    expiresIn: ACCESS_TOKEN_TTL,
  });

const createToken = () => crypto.randomBytes(32).toString("hex");
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 15,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS,
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", cookieOptions);
  res.clearCookie("refreshToken", cookieOptions);
};

const sendResetEmail = async (to, resetUrl) => {
  if (!smtpTransport) return false;
  const from = process.env.SMTP_FROM || "no-reply@devboard.local";
  await smtpTransport.sendMail({
    from,
    to,
    subject: "Reset your DevBoard Pro password",
    text: `Reset your password: ${resetUrl}`,
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
  });
  return true;
};

const sendVerifyEmail = async (to, verifyUrl) => {
  if (!smtpTransport) return false;
  const from = process.env.SMTP_FROM || "no-reply@devboard.local";
  await smtpTransport.sendMail({
    from,
    to,
    subject: "Verify your DevBoard Pro email",
    text: `Verify your email: ${verifyUrl}`,
    html: `<p>Verify your email:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
  });
  return true;
};

const isValidEmail = (email) => /.+@.+\..+/.test(email);
const isStrongPassword = (password) =>
  typeof password === "string" &&
  password.length >= 8 &&
  password.length <= 128 &&
  /[A-Za-z]/.test(password) &&
  /\d/.test(password);

// POST /api/auth/register
router.post("/register", authLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ message: "Missing fields" });

    const emailNorm = normalizeEmail(email);
    const nameClean = String(name).trim();
    if (!isValidEmail(emailNorm)) return res.status(400).json({ message: "Invalid email" });
    if (nameClean.length < 2) return res.status(400).json({ message: "Name too short" });
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters and include a number." });
    }

    const existing = await User.findOne({ email: emailNorm });
    if (existing) return res.status(400).json({ message: "Email in use" });

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = createToken();
    const verifyTokenHash = hashToken(verifyToken);

    const user = await User.create({
      email: emailNorm,
      passwordHash,
      name: nameClean,
      verifyTokenHash,
      verifyTokenExpires: new Date(Date.now() + VERIFY_TOKEN_TTL_MS),
      isEmailVerified: false,
    });

    const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;
    const sent = await sendVerifyEmail(user.email, verifyUrl);

    if (sent) {
      return res.status(201).json({
        message: "Verification email sent. Please check your inbox.",
        requiresVerification: true,
      });
    }

    if (!isProd) {
      return res.status(201).json({
        message: "Verification link generated (dev mode).",
        requiresVerification: true,
        verifyUrl,
      });
    }

    return res.status(201).json({
      message: "Verification email queued.",
      requiresVerification: true,
    });
  } catch (err) {
    console.error("Auth register error:", err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Missing fields" });

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const hashed = user.passwordHash ?? user.password;
    if (!hashed) return res.status(500).json({ message: "Server error" });

    const isMatch = await bcrypt.compare(password, hashed);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        requiresVerification: true,
      });
    }

    const accessToken = issueAccessToken(user._id);
    const refreshToken = createToken();
    user.refreshTokenHash = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS);
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Auth login error:", err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/resend-verification
router.post("/resend-verification", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (!user) return res.json({ message: "If the email exists, a verification link was sent." });
    if (user.isEmailVerified) return res.json({ message: "Email already verified." });

    const verifyToken = createToken();
    user.verifyTokenHash = hashToken(verifyToken);
    user.verifyTokenExpires = new Date(Date.now() + VERIFY_TOKEN_TTL_MS);
    await user.save();

    const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;
    const sent = await sendVerifyEmail(user.email, verifyUrl);

    if (sent) return res.json({ message: "Verification email sent." });
    if (!isProd) return res.json({ message: "Verification link generated (dev mode).", verifyUrl });
    return res.json({ message: "Verification email queued." });
  } catch (err) {
    console.error("Auth resend verification error:", err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/auth/verify-email
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ message: "Missing token" });

    const tokenHash = hashToken(String(token));
    const user = await User.findOne({
      verifyTokenHash: tokenHash,
      verifyTokenExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.isEmailVerified = true;
    user.verifyTokenHash = undefined;
    user.verifyTokenExpires = undefined;

    const accessToken = issueAccessToken(user._id);
    const refreshToken = createToken();
    user.refreshTokenHash = hashToken(refreshToken);
    user.refreshTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS);
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      message: "Email verified successfully.",
      user: { id: user._id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("Auth verify error:", err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/forgot - request password reset
router.post("/forgot", resetLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Missing email" });

    const user = await User.findOne({ email: normalizeEmail(email) });
    if (user) {
      const resetToken = createToken();
      const resetTokenHash = hashToken(resetToken);
      user.resetTokenHash = resetTokenHash;
      user.resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();

      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
      const sent = await sendResetEmail(user.email, resetUrl);
      if (sent) return res.json({ message: "Reset email sent." });

      if (!isProd) {
        return res.json({ message: "Reset link generated (dev mode).", resetUrl });
      }
    }

    return res.json({ message: "If the email exists, a reset link has been sent." });
  } catch (err) {
    console.error("Auth forgot error:", err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/reset - reset password using token
router.post("/reset", resetLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: "Missing fields" });
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: "Password must be at least 8 characters and include a number." });
    }

    const tokenHash = hashToken(String(token));
    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpires: { $gt: new Date() },
    });

    if (!user) return res.status(400).json({ message: "Invalid or expired token" });

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetTokenHash = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error("Auth reset error:", err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "No refresh token" });
    }

    const refreshTokenHash = hashToken(String(refreshToken));
    const user = await User.findOne({
      refreshTokenHash,
      refreshTokenExpires: { $gt: new Date() },
    });

    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ message: "Invalid refresh token" });
    }
    if (!user.isEmailVerified) return res.status(403).json({ message: "Email not verified" });

    const accessToken = issueAccessToken(user._id);
    const newRefreshToken = createToken();
    user.refreshTokenHash = hashToken(newRefreshToken);
    user.refreshTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24 * REFRESH_TOKEN_DAYS);
    await user.save();

    setAuthCookies(res, accessToken, newRefreshToken);

    res.json({ user: { id: user._id, email: user.email, name: user.name } });
  } catch (err) {
    console.error("Auth refresh error:", err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/auth/logout
router.post("/logout", async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) {
      const refreshTokenHash = hashToken(String(refreshToken));
      await User.updateOne(
        { refreshTokenHash },
        { $unset: { refreshTokenHash: 1, refreshTokenExpires: 1 } }
      );
    }
  } catch (err) {
    console.error("Auth logout error:", err.stack || err);
  } finally {
    clearAuthCookies(res);
    res.json({ message: "Logged out" });
  }
});

// GET /api/auth/me - returns current user info if token valid
router.get("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select("-passwordHash -__v");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("Auth /me error:", err.stack || err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
