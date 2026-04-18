import { describe, it, expect } from "vitest";
import { IMAP_PROVIDERS, getImapConfig, PROVIDER_OPTIONS } from "@/lib/email-providers";

describe("email-providers", () => {
  it("has correct IMAP configs for all providers", () => {
    expect(IMAP_PROVIDERS.qq).toEqual({ host: "imap.qq.com", port: 993, label: "QQ 邮箱" });
    expect(IMAP_PROVIDERS["163"]).toEqual({ host: "imap.163.com", port: 993, label: "163 邮箱" });
    expect(IMAP_PROVIDERS.gmail).toEqual({ host: "imap.gmail.com", port: 993, label: "Gmail" });
    expect(IMAP_PROVIDERS.outlook).toEqual({ host: "outlook.office365.com", port: 993, label: "Outlook" });
  });

  it("getImapConfig returns config for known providers", () => {
    expect(getImapConfig("qq")).toEqual({ host: "imap.qq.com", port: 993, label: "QQ 邮箱" });
    expect(getImapConfig("gmail")).toEqual({ host: "imap.gmail.com", port: 993, label: "Gmail" });
  });

  it("getImapConfig returns null for unknown provider", () => {
    expect(getImapConfig("unknown")).toBeNull();
    expect(getImapConfig("")).toBeNull();
  });

  it("PROVIDER_OPTIONS has correct structure", () => {
    expect(PROVIDER_OPTIONS).toHaveLength(4);
    expect(PROVIDER_OPTIONS[0]).toEqual({ value: "163", label: "163 邮箱" });
  });
});
