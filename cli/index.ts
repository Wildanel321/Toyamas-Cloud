import { Command } from "commander";
import fs from "fs";
import path from "path";
import os from "os";

const CONFIG_DIR = path.join(os.homedir(), ".toyamas");
const CONFIG_FILE = path.join(CONFIG_DIR, "config.json");

interface ToyamasCliConfig {
  apiUrl: string;
  token?: string;
  email?: string;
}

function loadConfig(): ToyamasCliConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8"));
    }
  } catch {
    // Return default
  }
  return {
    apiUrl: process.env.TOYAMAS_URL || "http://localhost:3000",
  };
}

function saveConfig(config: ToyamasCliConfig): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save CLI config:", err);
  }
}

async function apiRequest(
  endpoint: string,
  method = "GET",
  body?: Record<string, unknown>
): Promise<any> {
  const config = loadConfig();
  const url = `${config.apiUrl.replace(/\/$/, "")}${endpoint}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (config.token) {
    headers["Cookie"] = `toyamas_session=${config.token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }
  return data;
}

const program = new Command();

program
  .name("toyamas")
  .description("Toyamas Cloud PaaS CLI — Simple deployment. Your infrastructure.")
  .version("0.1.0");

// Command: toyamas login
program
  .command("login")
  .description("Authenticate with Toyamas Cloud control plane")
  .option("--url <url>", "Control plane URL", "http://localhost:3000")
  .argument("<email>", "Admin or user email")
  .argument("<password>", "Password")
  .action(async (email, password, options) => {
    try {
      console.log(`Connecting to Toyamas Cloud at ${options.url}...`);
      const res = await fetch(`${options.url.replace(/\/$/, "")}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error(`❌ Login failed: ${data.error || "Invalid credentials"}`);
        process.exit(1);
      }

      // Extract set-cookie header for token
      const cookie = res.headers.get("set-cookie") || "";
      const match = cookie.match(/toyamas_session=([^;]+)/);
      const token = match ? match[1] : "";

      saveConfig({
        apiUrl: options.url,
        email,
        token,
      });

      console.log(`✅ Authenticated successfully as ${data.user.name} (${data.user.email}) [${data.user.role}]`);
    } catch (err: any) {
      console.error(`❌ Error connecting to control plane: ${err.message}`);
      process.exit(1);
    }
  });

// Command: toyamas projects
program
  .command("projects")
  .description("List all deployed applications and projects")
  .action(async () => {
    try {
      const data = await apiRequest("/api/projects");
      console.log("\n📦 TOYAMAS CLOUD PROJECTS\n");
      console.log("NAME".padEnd(20) + "SLUG".padEnd(20) + "STATUS".padEnd(12) + "RUNTIME".padEnd(12) + "URL");
      console.log("-".repeat(85));

      for (const p of data.projects) {
        const domain = p.domain || `${p.slug}.wildanstore.my.id`;
        console.log(
          p.name.substring(0, 18).padEnd(20) +
          p.slug.substring(0, 18).padEnd(20) +
          p.status.padEnd(12) +
          p.runtime.padEnd(12) +
          `https://${domain}`
        );
      }
      console.log("");
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
    }
  });

// Command: toyamas deploy <slug>
program
  .command("deploy")
  .description("Trigger deployment for a project")
  .argument("<slug>", "Project slug")
  .action(async (slug) => {
    try {
      const { projects } = await apiRequest("/api/projects");
      const project = projects.find((p: any) => p.slug === slug || p.id === slug);

      if (!project) {
        console.error(`❌ Project with slug '${slug}' not found.`);
        process.exit(1);
      }

      console.log(`🚀 Initiating deployment for project '${project.name}' (${project.slug})...`);
      const res = await apiRequest(`/api/projects/${project.id}/deploy`, "POST");
      console.log(`✅ Deployment #${res.deployment.id.substring(0, 8)} queued successfully! Status: ${res.deployment.status}`);
      console.log(`View live logs at: https://${project.domain || project.slug + ".wildanstore.my.id"}`);
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
    }
  });

// Command: toyamas logs <slug>
program
  .command("logs")
  .description("Fetch runtime container logs for a project")
  .argument("<slug>", "Project slug")
  .option("-n, --tail <lines>", "Number of lines to tail", "50")
  .action(async (slug, options) => {
    try {
      const { projects } = await apiRequest("/api/projects");
      const project = projects.find((p: any) => p.slug === slug || p.id === slug);

      if (!project) {
        console.error(`❌ Project '${slug}' not found.`);
        process.exit(1);
      }

      const data = await apiRequest(`/api/projects/${project.id}/logs?tail=${options.tail}`);
      console.log(`\n📋 Runtime logs for toyamas-${project.slug}:\n`);
      console.log(data.logs || "No logs available.");
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
    }
  });

// Command: toyamas restart <slug>
program
  .command("restart")
  .description("Restart container instance for a project")
  .argument("<slug>", "Project slug")
  .action(async (slug) => {
    try {
      const { projects } = await apiRequest("/api/projects");
      const project = projects.find((p: any) => p.slug === slug || p.id === slug);

      if (!project) {
        console.error(`❌ Project '${slug}' not found.`);
        process.exit(1);
      }

      console.log(`🔄 Restarting container toyamas-${project.slug}...`);
      await apiRequest(`/api/projects/${project.id}/restart`, "POST");
      console.log(`✅ Project '${project.name}' restarted successfully.`);
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
    }
  });

// Command: toyamas status
program
  .command("status")
  .description("Check cluster and VPS telemetry status")
  .action(async () => {
    try {
      const data = await apiRequest("/api/system/health");
      console.log("\n⚡ TOYAMAS CLOUD SYSTEM TELEMETRY\n");
      console.log(`Status:      ${data.status.toUpperCase()}`);
      console.log(`Database:    ${data.services.database.status} (${data.services.database.latencyMs}ms)`);
      console.log(`Redis:       ${data.services.redis.status}`);
      console.log(`Host CPU:    ${data.system.cpuUsagePercent}% (${data.system.cpuCores} cores)`);
      console.log(`Host RAM:    ${data.system.memoryUsagePercent}% (${Math.round(data.system.usedMemoryBytes / 1024 / 1024)} MB used)`);
      console.log(`OS:          ${data.system.platform} (${data.system.arch})\n`);
    } catch (err: any) {
      console.error(`❌ Error: ${err.message}`);
    }
  });

export { program };
