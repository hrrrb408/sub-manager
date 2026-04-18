export const IMAP_PROVIDERS: Record<string, { host: string; port: number; label: string }> = {
  qq: { host: "imap.qq.com", port: 993, label: "QQ 邮箱" },
  "163": { host: "imap.163.com", port: 993, label: "163 邮箱" },
  gmail: { host: "imap.gmail.com", port: 993, label: "Gmail" },
  outlook: { host: "outlook.office365.com", port: 993, label: "Outlook" },
};

export function getImapConfig(provider: string) {
  return IMAP_PROVIDERS[provider] || null;
}

export const PROVIDER_OPTIONS = Object.entries(IMAP_PROVIDERS).map(([value, { label }]) => ({
  value,
  label,
}));
