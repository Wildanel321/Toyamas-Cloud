import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { ensureDockerfile } from "@/lib/deployment/dockerfile";
import fs from "fs/promises";
import path from "path";
import os from "os";

describe("Dockerfile Generation", () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "toyamas-test-"));
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("should generate a multi-stage Dockerfile for Next.js", async () => {
    const dfPath = await ensureDockerfile(tempDir, "nextjs", 3000);
    const content = await fs.readFile(dfPath, "utf8");

    expect(content).toContain("FROM node:20-alpine AS builder");
    expect(content).toContain("npm run build");
    expect(content).toContain("EXPOSE 3000");
  });

  it("should generate a Python Dockerfile for FastAPI/Flask", async () => {
    const dfPath = await ensureDockerfile(tempDir, "python", 8000);
    const content = await fs.readFile(dfPath, "utf8");

    expect(content).toContain("FROM python:3.11-slim");
    expect(content).toContain("pip install");
    expect(content).toContain("EXPOSE 8000");
  });

  it("should preserve an existing Dockerfile in repository", async () => {
    const existing = "FROM alpine\nCMD echo 'Custom Image'";
    await fs.writeFile(path.join(tempDir, "Dockerfile"), existing, "utf8");

    const dfPath = await ensureDockerfile(tempDir, "nodejs", 3000);
    const content = await fs.readFile(dfPath, "utf8");

    expect(content).toBe(existing);
  });
});
