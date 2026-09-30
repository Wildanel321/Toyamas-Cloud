import { describe, it, expect } from "vitest";
import { validateSafePath, maskSecretsInLog } from "@/lib/security/sanitize";
import { checkRateLimit } from "@/lib/security/rate-limit";
import path from "path";

describe("Security Hardening & Protection", () => {
  it("should prevent directory traversal attacks", () => {
    const rootDir = path.resolve(process.cwd(), "storage");
    const safeChild = "builds/project-1/app";
    const maliciousEscape = "../../etc/passwd";

    expect(() => validateSafePath(rootDir, safeChild)).not.toThrow();
    expect(() => validateSafePath(rootDir, maliciousEscape)).toThrow(/Path traversal detected/);
  });

  it("should mask secrets and tokens in log strings", () => {
    const rawLog = "Connecting with password=SuperSecretPassword and token=eyJhGciOi... to DB";
    const masked = maskSecretsInLog(rawLog, ["SuperSecretPassword"]);

    expect(masked).not.toContain("SuperSecretPassword");
    expect(masked).toContain("••••••••••••");
  });

  it("should enforce rate limiting thresholds", () => {
    const key = "test-ip-rate-limit";
    const limit = 3;
    const windowSeconds = 60;

    expect(checkRateLimit({ key, limit, windowSeconds }).success).toBe(true);
    expect(checkRateLimit({ key, limit, windowSeconds }).success).toBe(true);
    expect(checkRateLimit({ key, limit, windowSeconds }).success).toBe(true);
    expect(checkRateLimit({ key, limit, windowSeconds }).success).toBe(false); // Exceeded
  });
});
