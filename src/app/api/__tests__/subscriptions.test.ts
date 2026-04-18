import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetUserId = vi.fn();
const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockUpdateMany = vi.fn();

vi.mock("@/lib/get-user", () => ({
  getUserId: mockGetUserId,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    subscription: {
      findMany: mockFindMany,
      findFirst: mockFindFirst,
      create: mockCreate,
      updateMany: mockUpdateMany,
    },
  },
}));

// Import after mocks
const { GET, POST } = await import("@/app/api/subscriptions/route");

function makeRequest(url: string, options?: RequestInit): NextRequest {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new NextRequest(new URL(url, "http://localhost:3000"), options as any);
}

describe("GET /api/subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUserId.mockResolvedValue(null);
    const res = await GET(makeRequest("/api/subscriptions"));
    expect(res.status).toBe(401);
  });

  it("returns subscriptions for authenticated user", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    const subs = [{ id: "s1", name: "Netflix", userId: "user-1", status: "active", endDate: "2030-01-01" }];
    mockFindMany.mockResolvedValue(subs);

    const res = await GET(makeRequest("/api/subscriptions"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(subs);
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } })
    );
  });

  it("passes filter params to query", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    mockFindMany.mockResolvedValue([]);

    await GET(makeRequest("/api/subscriptions?status=active&category=ai&search=openai"));
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          status: "active",
          category: "ai",
          OR: expect.arrayContaining([
            { name: { contains: "openai" } },
          ]),
        }),
      })
    );
  });

  it("auto-marks expired subscriptions", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    const pastDate = new Date("2020-01-01").toISOString();
    const subs = [
      { id: "expired-1", name: "Old", userId: "user-1", status: "active", endDate: pastDate },
      { id: "active-1", name: "New", userId: "user-1", status: "active", endDate: "2030-01-01" },
    ];
    mockFindMany.mockResolvedValue(subs);
    mockUpdateMany.mockResolvedValue({ count: 1 });

    const res = await GET(makeRequest("/api/subscriptions"));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].status).toBe("expired");
  });
});

describe("POST /api/subscriptions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUserId.mockResolvedValue(null);
    const res = await POST(makeRequest("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
    }));
    expect(res.status).toBe(401);
  });

  it("returns 409 on duplicate active subscription", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    mockFindFirst.mockResolvedValue({ id: "existing", name: "Netflix", platform: "Netflix" });

    const res = await POST(makeRequest("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({ name: "Netflix", platform: "Netflix", amount: 15, startDate: "2025-01-01" }),
    }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.duplicate).toBe(true);
  });

  it("creates subscription successfully", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    mockFindFirst.mockResolvedValue(null);
    const created = { id: "new-1", name: "Netflix", userId: "user-1" };
    mockCreate.mockResolvedValue(created);

    const res = await POST(makeRequest("/api/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        name: "Netflix",
        platform: "Netflix",
        amount: "15.99",
        startDate: "2025-01-01",
        billingCycle: "monthly",
      }),
    }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data).toEqual(created);
  });
});
