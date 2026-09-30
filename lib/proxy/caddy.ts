import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

export interface ProjectProxyInfo {
  name: string;
  slug: string;
  domain?: string | null;
  containerName?: string | null;
  containerPort: number;
  domains?: { hostname: string }[];
}

export async function generateCaddyfile(customProjects?: ProjectProxyInfo[]): Promise<string> {
  const baseDomain = process.env.BASE_DOMAIN || "wildanstore.my.id";
  let projects: ProjectProxyInfo[] = [];

  if (customProjects) {
    projects = customProjects;
  } else {
    try {
      projects = await prisma.project.findMany({
        where: {
          status: "RUNNING",
          containerName: { not: null },
        },
        include: {
          domains: true,
        },
      });
    } catch {
      // If DB is offline during generation, fallback to empty list
      projects = [];
    }
  }

  let caddyfile = `# Toyamas Cloud - Automatically Generated Caddyfile
# Do not edit manually - managed by Toyamas Cloud control plane

{
  admin 0.0.0.0:2019
  email admin@${baseDomain}
}

# Control Plane Dashboard
${baseDomain} {
  reverse_proxy 127.0.0.1:3000
}

`;

  for (const p of projects) {
    if (!p.containerName) continue;

    const hostnames = new Set<string>();

    // Add default subdomain
    if (p.domain) {
      hostnames.add(p.domain);
    } else {
      hostnames.add(`${p.slug}.${baseDomain}`);
    }

    // Add any custom domains
    if (p.domains) {
      for (const d of p.domains) {
        hostnames.add(d.hostname);
      }
    }

    for (const host of hostnames) {
      caddyfile += `${host} {\n`;
      caddyfile += `  reverse_proxy ${p.containerName}:${p.containerPort}\n`;
      caddyfile += `  encode gzip zstd\n`;
      caddyfile += `}\n\n`;
    }
  }

  return caddyfile;
}

export async function updateCaddyProxyRoutes(): Promise<{
  success: boolean;
  caddyfilePath: string;
  reloaded: boolean;
}> {
  try {
    const content = await generateCaddyfile();
    const caddyDir = path.resolve(process.cwd(), "storage", "caddy");
    await fs.mkdir(caddyDir, { recursive: true });

    const caddyfilePath = path.join(caddyDir, "Caddyfile");
    await fs.writeFile(caddyfilePath, content, "utf8");

    // Try reloading Caddy via Admin API if available
    let reloaded = false;
    const adminApi = process.env.CADDY_ADMIN_API || "http://localhost:2019";

    try {
      const res = await fetch(`${adminApi}/load`, {
        method: "POST",
        headers: { "Content-Type": "text/caddyfile" },
        body: content,
      });
      if (res.ok) {
        reloaded = true;
      }
    } catch {
      // Caddy daemon not active locally, config is written to file
    }

    return {
      success: true,
      caddyfilePath,
      reloaded,
    };
  } catch (error) {
    console.error("[Caddy Proxy] Failed to generate configuration:", error);
    return {
      success: false,
      caddyfilePath: "",
      reloaded: false,
    };
  }
}
