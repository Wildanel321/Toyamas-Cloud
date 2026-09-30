import { describe, it, expect } from "vitest";
import { generateCaddyfile } from "@/lib/proxy/caddy";

describe("Caddy Reverse Proxy Configuration", () => {
  it("should generate a valid Caddyfile with base domain and admin endpoint", async () => {
    const caddyfile = await generateCaddyfile([]);
    expect(caddyfile).toContain("admin 0.0.0.0:2019");
    expect(caddyfile).toContain("reverse_proxy 127.0.0.1:3000");
    expect(caddyfile).toContain("wildanstore.my.id");
  });

  it("should generate proxy upstream blocks for running projects and custom domains", async () => {
    const sampleProjects = [
      {
        name: "DagangKu",
        slug: "dagangku",
        domain: "dagangku.wildanstore.my.id",
        containerName: "toyamas-dagangku",
        containerPort: 3000,
        domains: [{ hostname: "shop.example.com" }],
      },
    ];

    const caddyfile = await generateCaddyfile(sampleProjects);
    expect(caddyfile).toContain("dagangku.wildanstore.my.id {");
    expect(caddyfile).toContain("reverse_proxy toyamas-dagangku:3000");
    expect(caddyfile).toContain("shop.example.com {");
    expect(caddyfile).toContain("encode gzip zstd");
  });
});
