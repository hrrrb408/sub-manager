import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFindUnique = vi.fn();
const mockCreate = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      create: mockCreate,
    },
  },
}));

vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
  },
}));

const { POST } = await import("@/app/api/register/route");

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/register", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/register", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns 400 if email is missing", async () => {
    const res = await POST(makeRequest({ password: "123456" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("邮箱");
  });

  it("returns 400 if password is too short", async () => {
    const res = await POST(makeRequest({ email: "test@test.com", password: "12345" }));
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("6");
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", password: "123456" }));
    expect(res.status).toBe(400);
  });

  it("returns 409 if email already registered", async () => {
    mockFindUnique.mockResolvedValue({ id: "existing", email: "test@test.com" });
    const res = await POST(makeRequest({ email: "test@test.com", password: "123456" }));
    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error).toContain("已注册");
  });

  it("creates user successfully", async () => {
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: "new-1", email: "new@test.com", name: "new" });

    const res = await POST(makeRequest({ email: "new@test.com", password: "123456" }));
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.email).toBe("new@test.com");
    expect(data).not.toHaveProperty("password");
  });
});
