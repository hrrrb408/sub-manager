import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUserId = vi.fn();
const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();

vi.mock("@/lib/get-user", () => ({
  getUserId: mockGetUserId,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    budgetConfig: {
      findUnique: mockFindUnique,
      upsert: mockUpsert,
    },
  },
}));

const { GET, PUT } = await import("@/app/api/budget/route");

function makeRequest(url: string, options?: RequestInit) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(new URL(url, "http://localhost:3000"), options as any);
}

describe("GET /api/budget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUserId.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns defaults when no config exists", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    mockFindUnique.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual({ id: "default", monthlyBudget: 0, yearlyBudget: 0, currency: "USD" });
  });

  it("returns existing config", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    const config = { id: "default", userId: "user-1", monthlyBudget: 100, yearlyBudget: 1200, currency: "CNY" };
    mockFindUnique.mockResolvedValue(config);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.monthlyBudget).toBe(100);
  });
});

describe("PUT /api/budget", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUserId.mockResolvedValue(null);
    const res = await PUT(makeRequest("/api/budget", {
      method: "PUT",
      body: JSON.stringify({ monthlyBudget: 200 }),
    }));
    expect(res.status).toBe(401);
  });

  it("upserts budget config", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    const upserted = { id: "default", userId: "user-1", monthlyBudget: 200, yearlyBudget: 2400, currency: "USD" };
    mockUpsert.mockResolvedValue(upserted);

    const res = await PUT(makeRequest("/api/budget", {
      method: "PUT",
      body: JSON.stringify({ monthlyBudget: 200, yearlyBudget: 2400, currency: "USD" }),
    }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.monthlyBudget).toBe(200);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });
});
