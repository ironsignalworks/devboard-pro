import { describe, test, expect, beforeAll, vi } from "vitest";
import request from "supertest";
import express from "express";
import searchRoutes from "../src/routes/search.js";

vi.mock("../src/middleware/auth.js", () => ({
  requireAuth: (req, _res, next) => {
    req.userId = "user-123";
    next();
  },
}));

const { snippetFind, noteFind, projectFind } = vi.hoisted(() => {
  const snippetFind = vi.fn(() => ({
    sort: () => ({
      limit: () => ({
        lean: async () => [{ _id: "s1", title: "S1", updatedAt: new Date().toISOString(), tags: [] }],
      }),
    }),
  }));
  const noteFind = vi.fn(() => ({
    sort: () => ({
      limit: () => ({
        lean: async () => [{ _id: "n1", title: "N1", updatedAt: new Date().toISOString(), tags: [] }],
      }),
    }),
  }));
  const projectFind = vi.fn(() => ({
    sort: () => ({
      limit: () => ({
        lean: async () => [{ _id: "p1", title: "P1", updatedAt: new Date().toISOString(), tags: [] }],
      }),
    }),
  }));
  return { snippetFind, noteFind, projectFind };
});

vi.mock("../src/models/Snippet.js", () => ({ default: { find: snippetFind } }));
vi.mock("../src/models/Note.js", () => ({ default: { find: noteFind } }));
vi.mock("../src/models/Project.js", () => ({ default: { find: projectFind } }));

let app;
beforeAll(() => {
  app = express();
  app.use(express.json());
  app.use("/api/search", searchRoutes);
});

describe("Search routes", () => {
  test("GET /api/search escapes regex query input", async () => {
    const res = await request(app).get("/api/search?q=a.*(b)");
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);

    const snippetQuery = snippetFind.mock.calls[0][0];
    const snippetRegex = snippetQuery.$or[0].title.$regex;
    expect(snippetRegex).toBe("a\\.\\*\\(b\\)");
  });

  test("GET /api/search with empty query returns empty list", async () => {
    const res = await request(app).get("/api/search?q=");
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });
});
