import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUserId = vi.fn();
const mockFindMany = vi.fn();
const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/get-user", () => ({
  getUserId: mockGetUserId,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    emailConnection: {
      findMany: mockFindMany,
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

// Mock server crypto to avoid AUTH_SECRET dependency
vi.mock("@/lib/server-crypto", () => ({
  encryptServer: vi.fn().mockReturnValue("encrypted-mock"),
}));

// Mock email-providers to avoid import issues
vi.mock("@/lib/email-providers", () => ({
  getImapConfig: (p: string) => {
    const map: Record<string, { host: string; port: number }> = {
      qq: { host: "imap.qq.com", port: 993 },
    };
    return map[p] || null;
  },
  IMAP_PROVIDERS: {},
  PROVIDER_OPTIONS: [],
}));

const { GET, POST } = await import("@/app/api/email-connection/route");

function makeRequest(url: string, options?: RequestInit) {
  return new Request(new URL(url, "http://localhost:3000"), options);
}

describe("GET /api/email-connection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUserId.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns connections with masked passwords", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    mockFindMany.mockResolvedValue([
      { id: "ec-1", email: "test@qq.com", encryptedPassword: "real-encrypted-value", provider: "qq" },
    ]);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].encryptedPassword).toBe("••••••");
    expect(data[0].email).toBe("test@qq.com");
  });
});

describe("POST /api/email-connection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 401 when not authenticated", async () => {
    mockGetUserId.mockResolvedValue(null);
    const res = await POST(makeRequest("/api/email-connection", {
      method: "POST",
      body: JSON.stringify({ provider: "qq", email: "test@qq.com", password: "auth-code" }),
    }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when email or password missing", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    const res = await POST(makeRequest("/api/email-connection", {
      method: "POST",
      body: JSON.stringify({ provider: "qq" }),
    }));
    expect(res.status).toBe(400);
  });

  it("returns 409 on duplicate email", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    mockFindUnique.mockResolvedValue({ id: "ec-1" });

    const res = await POST(makeRequest("/api/email-connection", {
      method: "POST",
      body: JSON.stringify({ provider: "qq", email: "test@qq.com", password: "auth-code" }),
    }));
    expect(res.status).toBe(409);
  });

  it("creates connection with provider preset", async () => {
    mockGetUserId.mockResolvedValue("user-1");
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "ec-1", email: "test@qq.com", provider: "qq", imapHost: "imap.qq.com", imapPort: 993 });

    const res = await POST(makeRequest("/api/email-connection", {
      method: "POST",
      body: JSON.stringify({ provider: "qq", email: "test@qq.com", password: "auth-code" }),
    }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.encryptedPassword).toBe("••••••");
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ imapHost: "imap.qq.com", imapPort: 993 }),
      })
    );
  });
});
