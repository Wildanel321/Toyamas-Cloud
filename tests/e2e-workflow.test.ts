import { describe, it, expect } from "vitest";
import { slugify, isValidSlug } from "@/lib/projects/slug";
import { createProjectSchema } from "@/lib/projects/validation";
import { encryptSecret, decryptSecret } from "@/lib/auth/crypto";
import { createSessionToken, verifySessionToken } from "@/lib/auth/session";
import { generateCaddyfile } from "@/lib/proxy/caddy";

describe("Toyamas Cloud Core Lifecycle Flow", () => {
  it("should execute the full project creation, credentials encryption, session auth, and proxy generation flow", async () => {
    // 1. Generate & validate project metadata
    const projectName = "DagangKu Store";
    const slug = slugify(projectName);
    expect(slug).toBe("dagangku-store");
    expect(isValidSlug(slug)).toBe(true);

    const projectInput = {
      name: projectName,
      slug,
      repositoryUrl: "https://github.com/wildan/dagangku.git",
      branch: "main",
      runtime: "nextjs" as const,
      containerPort: 3000,
      cpuLimit: 0.5,
      memoryLimit: 512,
    };
    const validated = createProjectSchema.safeParse(projectInput);
    expect(validated.success).toBe(true);

    // 2. Encrypt environment variables
    const secretDbUrl = "postgresql://toyamas:pass@postgres:5432/dagangku";
    const encrypted = encryptSecret(secretDbUrl);
    expect(encrypted).not.toBe(secretDbUrl);
    expect(decryptSecret(encrypted)).toBe(secretDbUrl);

    // 3. Authenticate administrator session
    const sessionToken = await createSessionToken({
      userId: "admin_123",
      email: "admin@wildanstore.my.id",
      name: "Wildan Admin",
      role: "ADMIN",
    });
    const verifiedSession = await verifySessionToken(sessionToken);
    expect(verifiedSession?.role).toBe("ADMIN");

    // 4. Generate Caddy reverse proxy upstream routing
    const caddyConfig = await generateCaddyfile([
      {
        name: projectName,
        slug,
        domain: "dagangku-store.wildanstore.my.id",
        containerName: "toyamas-dagangku-store",
        containerPort: 3000,
        domains: [{ hostname: "dagangku.com" }],
      },
    ]);

    expect(caddyConfig).toContain("dagangku-store.wildanstore.my.id {");
    expect(caddyConfig).toContain("reverse_proxy toyamas-dagangku-store:3000");
    expect(caddyConfig).toContain("dagangku.com {");
  });
});
