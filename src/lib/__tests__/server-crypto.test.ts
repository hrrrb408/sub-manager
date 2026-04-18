import { describe, it, expect, beforeAll } from "vitest";
import { encryptServer, decryptServer } from "@/lib/server-crypto";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-for-vitest";
});

describe("server-crypto", () => {
  it("encrypts and decrypts round-trip", () => {
    const plaintext = "my-secret-password";
    const encrypted = encryptServer(plaintext);
    expect(encrypted).not.toBe(plaintext);
    expect(decryptServer(encrypted)).toBe(plaintext);
  });

  it("produces different ciphertext each time (random IV)", () => {
    const plaintext = "same-input";
    const a = encryptServer(plaintext);
    const b = encryptServer(plaintext);
    expect(a).not.toBe(b);
    expect(decryptServer(a)).toBe(plaintext);
    expect(decryptServer(b)).toBe(plaintext);
  });

  it("handles empty string", () => {
    const encrypted = encryptServer("");
    expect(decryptServer(encrypted)).toBe("");
  });

  it("handles unicode / Chinese characters", () => {
    const plaintext = "密码测试🔐";
    const encrypted = encryptServer(plaintext);
    expect(decryptServer(encrypted)).toBe(plaintext);
  });

  it("handles long strings", () => {
    const plaintext = "a".repeat(10000);
    const encrypted = encryptServer(plaintext);
    expect(decryptServer(encrypted)).toBe(plaintext);
  });
});
