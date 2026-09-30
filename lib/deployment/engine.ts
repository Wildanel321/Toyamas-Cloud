import path from "path";
import fs from "fs/promises";
import { prisma } from "@/lib/prisma";
import { cloneOrPullRepository } from "@/lib/git/manager";
import { ensureDockerfile } from "./dockerfile";
import { buildDockerImage } from "./builder";
import { checkContainerHealth } from "./health";
import {
  createAndStartContainer,
  stopContainer,
  removeContainer,
} from "@/lib/docker/container";
import { decryptSecret } from "@/lib/auth/crypto";
import { updateCaddyProxyRoutes } from "@/lib/proxy/caddy";

export interface RunDeploymentOptions {
  deploymentId: string;
  projectId: string;
}

export async function runDeploymentPipeline({
  deploymentId,
  projectId,
}: RunDeploymentOptions): Promise<void> {
  const logs: string[] = [];

  const addLog = async (message: string) => {
    const timestamp = new Date().toISOString().substring(11, 19);
    const line = `[${timestamp}] ${message}`;
    logs.push(line);
    console.log(`[Deployment ${deploymentId.substring(0, 7)}] ${line}`);

    // Periodically flush logs to database
    try {
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: { buildLog: logs.join("\n") },
      });
    } catch {
      // Non-blocking log save
    }
  };

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      environmentVariables: true,
      domains: true,
    },
  });

  if (!project) {
    throw new Error(`Project ${projectId} not found`);
  }

  const workspaceRoot = path.resolve(process.cwd(), "storage", "builds", projectId, deploymentId);
  const oldContainerId = project.containerId;
  let newContainerId: string | null = null;

  try {
    // 1. Mark BUILDING
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "BUILDING",
        startedAt: new Date(),
      },
    });

    await addLog(`Starting deployment for project: ${project.name} (${project.slug})`);

    // 2. Clone Git Repo
    const cloneInfo = await cloneOrPullRepository(
      project.repositoryUrl,
      project.branch,
      workspaceRoot,
      (msg) => addLog(msg)
    );

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        commitHash: cloneInfo.commitHash,
        commitMessage: cloneInfo.commitMessage,
      },
    });

    // 3. Ensure Dockerfile
    await ensureDockerfile(
      workspaceRoot,
      project.runtime,
      project.containerPort,
      (msg) => addLog(msg)
    );

    // 4. Build Docker Image
    const imageTag = `toyamas-${project.slug}:${deploymentId.toLowerCase()}`;
    await buildDockerImage({
      workspacePath: workspaceRoot,
      imageTag,
      onLog: (line) => addLog(line),
    });

    // 5. Mark DEPLOYING & Prepare Environment
    await prisma.deployment.update({
      where: { id: deploymentId },
      data: { status: "DEPLOYING" },
    });

    await addLog("Decrypting project environment variables...");
    const envMap: Record<string, string> = {
      PORT: project.containerPort.toString(),
      NODE_ENV: "production",
      TOYAMAS_PROJECT: project.slug,
      TOYAMAS_DEPLOYMENT_ID: deploymentId,
    };

    for (const ev of project.environmentVariables) {
      try {
        envMap[ev.key] = decryptSecret(ev.encryptedValue);
      } catch (err) {
        await addLog(`[Warning] Failed to decrypt env key ${ev.key}: ${err}`);
      }
    }

    // 6. Create & Start New Container
    const newContainerName = `toyamas-${project.slug}-${deploymentId.substring(0, 6)}`;
    await addLog(`Creating container ${newContainerName}...`);

    const containerInfo = await createAndStartContainer({
      imageName: imageTag,
      containerName: newContainerName,
      env: envMap,
      containerPort: project.containerPort,
      cpuLimit: project.cpuLimit,
      memoryLimitMB: project.memoryLimit,
    });

    newContainerId = containerInfo.containerId;
    await addLog(`Container started with ID: ${newContainerId.substring(0, 12)}`);

    // 7. Health Check Probe
    if (containerInfo.publicPort) {
      await addLog(`Performing zero-downtime healthcheck on port ${containerInfo.publicPort}...`);
      const isHealthy = await checkContainerHealth({
        port: containerInfo.publicPort,
        retries: 10,
        onLog: (m) => addLog(m),
      });

      if (!isHealthy) {
        throw new Error("Container health check failed. Application did not start HTTP listener.");
      }
    } else {
      await addLog("Container started without public port mapping. Waiting 3s for stabilization...");
      await new Promise((r) => setTimeout(r, 3000));
    }

    // 8. Update Reverse Proxy (Caddy)
    await addLog("Updating Caddy reverse proxy upstream routing...");
    await updateCaddyProxyRoutes();

    // 9. Stop and clean up old container if replacement succeeded
    if (oldContainerId && oldContainerId !== newContainerId) {
      await addLog(`Stopping previous container instance ${oldContainerId.substring(0, 12)}...`);
      await stopContainer(oldContainerId, 5);
      await removeContainer(oldContainerId, true);
    }

    // 10. Update Project & Deployment Status
    await prisma.project.update({
      where: { id: projectId },
      data: {
        containerId: newContainerId,
        containerName: newContainerName,
        status: "RUNNING",
      },
    });

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "RUNNING",
        finishedAt: new Date(),
        buildLog: logs.join("\n"),
      },
    });

    await addLog("Deployment completed successfully! Application is ONLINE.");
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Deployment failed";
    await addLog(`[CRITICAL ERROR] ${errMsg}`);

    // If new container failed, remove it
    if (newContainerId) {
      await addLog(`Cleaning up failed container ${newContainerId.substring(0, 12)}...`);
      await stopContainer(newContainerId, 2);
      await removeContainer(newContainerId, true);
    }

    await prisma.deployment.update({
      where: { id: deploymentId },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorMessage: errMsg,
        buildLog: logs.join("\n"),
      },
    });

    // If no running container exists, mark project FAILED
    if (!oldContainerId) {
      await prisma.project.update({
        where: { id: projectId },
        data: { status: "FAILED" },
      });
    }
  } finally {
    // Clean up temporary workspace directory
    try {
      await fs.rm(workspaceRoot, { recursive: true, force: true });
    } catch {
      // Non-blocking cleanup
    }
  }
}
