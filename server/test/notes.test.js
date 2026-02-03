import { describe, test, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import notesRoutes from "../src/routes/notes.js";

vi.mock("../src/middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.userId = "user-123";
    next();
  },
}));

vi.mock("../src/models/Note.js", () => {
  const chain = {
    sort: () => ({
      skip: () => ({
        limit: (n) =>
          Promise.resolve(
            Array.from({ length: n }, (_, i) => ({
              _id: String(i),
              title: `Note ${i}`,
            }))
          ),
      }),
    }),
  };

  return {
    default: {
      countDocuments: vi.fn().mockResolvedValue(25),
      find: vi.fn().mockReturnValue(chain),
    },
  };
});

let app;

beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use("/api/notes", notesRoutes);
});

describe("Notes routes (pagination)", () => {
  test("GET /api/notes returns paginated payload", async () => {
    const res = await request(app).get("/api/notes?page=2&limit=5");

    expect(res.status).toBe(200);
    expect(res.body.page).toBe(2);
    expect(res.body.limit).toBe(5);
    expect(res.body.total).toBe(25);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items).toHaveLength(5);
  });
});
