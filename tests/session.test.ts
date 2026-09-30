import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";

describe("JWT Session Management (jose)", () => {
  it("should create and verify a valid session token", async () => {
    const payload = {
      userId: "user_test_123",
      email: "admin@wildanstore.my.id",
      name: "Cluster Admin",
      role: "ADMIN" as const,
    };

    const token = await createSessionToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe(payload.userId);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.name).toBe(payload.name);
    expect(verified?.role).toBe(payload.role);
  });

  it("should reject tampered or corrupted tokens", async () => {
    const payload = {
      userId: "user_test_456",
      email: "attacker@test.com",
      name: "Attacker",
      role: "USER" as const,
    };

    const token = await createSessionToken(payload);
    const tamperedToken = token.slice(0, -5) + "abcde";

    const verified = await verifySessionToken(tamperedToken);
    expect(verified).toBeNull();
  });

  it("should reject malformed non-JWT strings", async () => {
    const verified = await verifySessionToken("invalid.token.here");
    expect(verified).toBeNull();
  });
});
