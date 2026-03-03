import { describe, test, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import authRoutes from "../src/routes/auth.js";

vi.mock("../src/middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.userId = "user-123";
    next();
  },
}));

const { findOneMock } = vi.hoisted(() => ({
  findOneMock: vi.fn().mockResolvedValue(null),
}));

vi.mock("../src/models/User.js", () => ({
  default: {
    findOne: findOneMock,
  },
}));

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use("/api/auth", authRoutes);
});

describe("Auth settings routes", () => {
  test("PUT /api/auth/profile rejects invalid email", async () => {
    const res = await request(app).put("/api/auth/profile").send({ name: "Test User", email: "bad-email" });
    expect(res.status).toBe(400);
  });

  test("PUT /api/auth/password rejects missing fields", async () => {
    const res = await request(app).put("/api/auth/password").send({ currentPassword: "" });
    expect(res.status).toBe(400);
  });
});
