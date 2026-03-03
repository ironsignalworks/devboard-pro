import { describe, test, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import projectsRoutes from "../src/routes/projects.js";

vi.mock("../src/middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.userId = "user-123";
    next();
  },
}));

const {
  limitSpy,
  skipSpy,
  sortSpy,
  findSpy,
  countSpy,
} = vi.hoisted(() => {
  const limitSpy = vi.fn();
  const skipSpy = vi.fn(() => ({ limit: limitSpy }));
  const sortSpy = vi.fn(() => ({ skip: skipSpy }));
  const findSpy = vi.fn(() => ({ sort: sortSpy }));
  const countSpy = vi.fn().mockResolvedValue(7);
  return { limitSpy, skipSpy, sortSpy, findSpy, countSpy };
});

vi.mock("../src/models/Project.js", () => ({
  default: {
    countDocuments: countSpy,
    find: findSpy,
  },
}));

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use("/api/projects", projectsRoutes);
  limitSpy.mockImplementation(async (n) =>
    Array.from({ length: n > 7 ? 7 : n }, (_, i) => ({ _id: `p-${i}`, title: `Project ${i}` }))
  );
});

describe("Projects routes", () => {
  test("GET /api/projects caps limit and returns pagination payload", async () => {
    const res = await request(app).get("/api/projects?page=1&limit=500&q=a.*");
    expect(res.status).toBe(200);
    expect(res.body.limit).toBe(100);
    expect(res.body.total).toBe(7);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(findSpy).toHaveBeenCalled();
  });
});
