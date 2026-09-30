import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret } from "@/lib/auth/crypto";

describe("AES-256-GCM Secret Encryption", () => {
  it("should encrypt and decrypt a plaintext secret correctly", () => {
    const rawSecret = "postgres://user:super_secret_password@db:5432/production";
    const encrypted = encryptSecret(rawSecret);

    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(rawSecret);
    expect(encrypted.split(":").length).toBe(3); // iv:authTag:cipher

    const decrypted = decryptSecret(encrypted);
    expect(decrypted).toBe(rawSecret);
  });

  it("should generate different ciphertexts for the same plaintext due to random IV", () => {
    const rawSecret = "MY_API_KEY_12345";
    const encrypted1 = encryptSecret(rawSecret);
    const encrypted2 = encryptSecret(rawSecret);

    expect(encrypted1).not.toBe(encrypted2);
    expect(decryptSecret(encrypted1)).toBe(rawSecret);
    expect(decryptSecret(encrypted2)).toBe(rawSecret);
  });

  it("should fail decryption if ciphertext or auth tag is tampered", () => {
    const rawSecret = "sensitive_data";
    const encrypted = encryptSecret(rawSecret);
    const [iv, authTag, data] = encrypted.split(":");

    // Tamper with encrypted data
    const tamperedData = data.slice(0, -2) + (data.slice(-2) === "aa" ? "bb" : "aa");
    const tampered = `${iv}:${authTag}:${tamperedData}`;

    expect(() => decryptSecret(tampered)).toThrow();
  });
});
