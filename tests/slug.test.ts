import { describe, it, expect } from "vitest";
import { slugify, isValidSlug } from "@/lib/projects/slug";
import { createProjectSchema, envVariableSchema, domainSchema } from "@/lib/projects/validation";

describe("Project Slug & Domain Validation", () => {
  it("should convert project names into DNS-safe slugs", () => {
    expect(slugify("DagangKu API")).toBe("dagangku-api");
    expect(slugify("My Cool Webapp 2026!")).toBe("my-cool-webapp-2026");
    expect(slugify("---test___slug---")).toBe("test-slug");
  });

  it("should validate valid DNS slugs", () => {
    expect(isValidSlug("dagangku")).toBe(true);
    expect(isValidSlug("api-server-1")).toBe(true);
    expect(isValidSlug("a")).toBe(false); // too short
    expect(isValidSlug("-start-with-hyphen")).toBe(false);
    expect(isValidSlug("end-with-hyphen-")).toBe(false);
    expect(isValidSlug("with spaces")).toBe(false);
  });

  it("should validate project creation input", () => {
    const valid = {
      name: "DagangKu",
      slug: "dagangku",
      repositoryUrl: "https://github.com/example/dagangku.git",
      branch: "main",
      runtime: "nextjs",
      containerPort: 3000,
      cpuLimit: 0.5,
      memoryLimit: 512,
    };
    const result = createProjectSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject invalid project inputs", () => {
    const invalid = {
      name: "D", // too short
      slug: "Invalid Slug!",
      repositoryUrl: "not-a-url",
      runtime: "invalid-runtime",
    };
    const result = createProjectSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should validate environment variable key formats", () => {
    expect(envVariableSchema.safeParse({ key: "DATABASE_URL", value: "postgres://...", isSecret: true }).success).toBe(true);
    expect(envVariableSchema.safeParse({ key: "INVALID KEY WITH SPACES", value: "test", isSecret: true }).success).toBe(false);
  });

  it("should validate domain hostnames", () => {
    expect(domainSchema.safeParse({ hostname: "app.wildanstore.my.id" }).success).toBe(true);
    expect(domainSchema.safeParse({ hostname: "example.com" }).success).toBe(true);
    expect(domainSchema.safeParse({ hostname: "invalid_domain" }).success).toBe(false);
  });
});
