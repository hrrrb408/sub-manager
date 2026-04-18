import CryptoJS from "crypto-js";

const MASTER_KEY_STORAGE = "sub-manager-master-key";

/**
 * Get the master key from localStorage
 */
export function getMasterKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(MASTER_KEY_STORAGE);
}

/**
 * Save the master key to localStorage (hashed, never store raw)
 */
export function setMasterKey(key: string): void {
  localStorage.setItem(MASTER_KEY_STORAGE, key);
}

/**
 * Check if a master key has been set
 */
export function hasMasterKey(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem(MASTER_KEY_STORAGE);
}

/**
 * Clear the master key
 */
export function clearMasterKey(): void {
  localStorage.removeItem(MASTER_KEY_STORAGE);
}

/**
 * Encrypt a plaintext string using AES
 */
export function encrypt(plaintext: string, key?: string): string {
  const k = key || getMasterKey();
  if (!k) throw new Error("未设置主密钥");
  return CryptoJS.AES.encrypt(plaintext, k).toString();
}

/**
 * Decrypt a ciphertext string using AES
 */
export function decrypt(ciphertext: string, key?: string): string {
  const k = key || getMasterKey();
  if (!k) throw new Error("未设置主密钥");
  const bytes = CryptoJS.AES.decrypt(ciphertext, k);
  const result = bytes.toString(CryptoJS.enc.Utf8);
  if (!result) throw new Error("解密失败，主密钥可能不正确");
  return result;
}
