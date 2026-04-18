import { vi } from "vitest";

export function mockGetUserId(userId: string | null) {
  vi.doMock("@/lib/get-user", () => ({
    getUserId: vi.fn().mockResolvedValue(userId),
  }));
}

export function mockPrisma(overrides: Record<string, unknown> = {}) {
  vi.doMock("@/lib/prisma", () => ({
    prisma: {
      subscription: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "sub-1" }),
        update: vi.fn().mockResolvedValue({ id: "sub-1" }),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        delete: vi.fn().mockResolvedValue({ id: "sub-1" }),
      },
      budgetConfig: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({ id: "default", monthlyBudget: 100, yearlyBudget: 1200, currency: "USD" }),
      },
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "user-1", email: "test@test.com" }),
      },
      emailConnection: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({ id: "ec-1" }),
        delete: vi.fn().mockResolvedValue({ id: "ec-1" }),
        update: vi.fn().mockResolvedValue({ id: "ec-1" }),
      },
      discoveredSubscription: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn().mockResolvedValue({ id: "ds-1" }),
      },
      notificationConfig: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({ id: "default" }),
      },
      notificationLog: {
        create: vi.fn().mockResolvedValue({}),
      },
      ...overrides,
    },
  }));
}

export function createRequest(url: string, options?: RequestInit): Request {
  return new Request(new URL(url, "http://localhost:3000"), options);
}
