import { describe, it, expect } from "vitest";
import { getNextRenewalDate, formatAmount, getCurrencySymbol } from "@/lib/types";

describe("getCurrencySymbol", () => {
  it("returns correct symbols", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencySymbol("GBP")).toBe("£");
    expect(getCurrencySymbol("CNY")).toBe("¥");
    expect(getCurrencySymbol("JPY")).toBe("¥");
  });

  it("returns currency code for unknown", () => {
    expect(getCurrencySymbol("ABC")).toBe("ABC");
  });
});

describe("formatAmount", () => {
  it("formats with correct symbol and 2 decimals", () => {
    expect(formatAmount(9.99, "USD")).toBe("$9.99");
    expect(formatAmount(100, "CNY")).toBe("¥100.00");
    expect(formatAmount(1234.5, "EUR")).toBe("€1,234.50");
  });

  it("formats zero", () => {
    expect(formatAmount(0, "USD")).toBe("$0.00");
  });
});

describe("getNextRenewalDate", () => {
  const today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };

  it("returns endDate if it is in the future", () => {
    const start = new Date("2025-01-01");
    start.setHours(0, 0, 0, 0);
    const end = new Date("2027-06-01");
    end.setHours(0, 0, 0, 0);
    const result = getNextRenewalDate(start, "monthly", end);
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBe(2027);
    expect(result!.getMonth()).toBe(5);
    expect(result!.getDate()).toBe(1);
  });

  it("calculates next monthly renewal from past startDate", () => {
    const start = new Date("2025-01-15");
    const result = getNextRenewalDate(start, "monthly");
    const expected = today();
    expected.setDate(15);
    if (expected < today()) expected.setMonth(expected.getMonth() + 1);
    expected.setHours(0, 0, 0, 0);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(15);
  });

  it("calculates next yearly renewal", () => {
    const start = new Date("2025-06-01");
    const result = getNextRenewalDate(start, "yearly");
    expect(result).not.toBeNull();
    expect(result!.getFullYear()).toBeGreaterThanOrEqual(2026);
    expect(result!.getMonth()).toBe(5); // June
  });

  it("calculates next weekly renewal", () => {
    const start = new Date("2025-01-06"); // Monday
    const result = getNextRenewalDate(start, "weekly");
    expect(result).not.toBeNull();
    // Should be a Monday in the future
    expect(result!.getDay()).toBe(1);
  });

  it("returns null for invalid startDate", () => {
    const result = getNextRenewalDate("invalid", "monthly");
    expect(result).toBeNull();
  });

  it("ignores past endDate and calculates from startDate", () => {
    const start = new Date("2025-01-01");
    const pastEnd = new Date("2025-02-01"); // already past
    const result = getNextRenewalDate(start, "monthly", pastEnd);
    expect(result).not.toBeNull();
    expect(result!.getTime()).toBeGreaterThan(pastEnd.getTime());
  });
});
