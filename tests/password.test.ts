import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("Password Hashing & Verification (bcryptjs)", () => {
  it("should hash a password and verify it successfully", async () => {
    const rawPassword = "SuperSecurePassword123!";
    const hash = await hashPassword(rawPassword);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(rawPassword);
    expect(hash.startsWith("$2")).toBe(true);

    const isValid = await verifyPassword(rawPassword, hash);
    expect(isValid).toBe(true);
  });

  it("should reject an incorrect password", async () => {
    const rawPassword = "CorrectPassword123";
    const wrongPassword = "WrongPassword456";
    const hash = await hashPassword(rawPassword);

    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it("should generate distinct hashes for identical inputs due to salts", async () => {
    const raw = "SamePasswordAcrossUsers";
    const hash1 = await hashPassword(raw);
    const hash2 = await hashPassword(raw);

    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(raw, hash1)).toBe(true);
    expect(await verifyPassword(raw, hash2)).toBe(true);
  });
});
