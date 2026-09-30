import { getDockerClient } from "./client";
import { ensureToyamasNetwork, TOYAMAS_DOCKER_NETWORK } from "./network";

export interface CreateContainerOptions {
  imageName: string;
  containerName: string;
  env: Record<string, string>;
  containerPort: number;
  cpuLimit: number; // e.g. 0.5 vCPU
  memoryLimitMB: number; // e.g. 512 MB
  labels?: Record<string, string>;
}

export interface ContainerStatsResult {
  cpuPercent: number;
  memoryUsageBytes: number;
  memoryLimitBytes: number;
  memoryPercent: number;
  networkRxBytes: number;
  networkTxBytes: number;
  pidsCount: number;
}

export async function createAndStartContainer(
  options: CreateContainerOptions
): Promise<{ containerId: string; containerName: string; publicPort?: number }> {
  const docker = getDockerClient();
  await ensureToyamasNetwork();

  // Convert environment object to array of KEY=VALUE
  const envArray = Object.entries(options.env).map(([k, v]) => `${k}=${v}`);

  // Calculate strict resource constraints
  const memoryBytes = options.memoryLimitMB * 1024 * 1024;
  const nanoCpus = Math.floor(options.cpuLimit * 1e9);

  // If container with same name already exists, remove it first
  try {
    const oldContainer = docker.getContainer(options.containerName);
    const info = await oldContainer.inspect();
    if (info.State.Running) {
      await oldContainer.stop({ t: 5 });
    }
    await oldContainer.remove({ force: true });
  } catch {
    // Container didn't exist, proceed
  }

  const exposedPort = `${options.containerPort}/tcp`;

  const container = await docker.createContainer({
    Image: options.imageName,
    name: options.containerName,
    Env: envArray,
    Labels: {
      "toyamas.managed": "true",
      "toyamas.project": options.containerName,
      ...options.labels,
    },
    ExposedPorts: {
      [exposedPort]: {},
    },
    HostConfig: {
      Memory: memoryBytes,
      NanoCpus: nanoCpus,
      PidsLimit: 200,
      RestartPolicy: {
        Name: "unless-stopped",
      },
      NetworkMode: TOYAMAS_DOCKER_NETWORK,
      PublishAllPorts: true, // Assigns random available host port for healthcheck/introspection
    },
  });

  await container.start();

  const inspect = await container.inspect();
  const ports = inspect.NetworkSettings.Ports[exposedPort];
  const hostPort = ports && ports.length > 0 ? parseInt(ports[0].HostPort, 10) : undefined;

  return {
    containerId: container.id,
    containerName: options.containerName,
    publicPort: hostPort,
  };
}

export async function stopContainer(containerId: string, timeoutSeconds = 10): Promise<void> {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);
  try {
    const info = await container.inspect();
    if (info.State.Running) {
      await container.stop({ t: timeoutSeconds });
    }
  } catch (error) {
    console.error(`[Docker] Failed to stop container ${containerId}:`, error);
  }
}

export async function startContainer(containerId: string): Promise<void> {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);
  await container.start();
}

export async function restartContainer(containerId: string, timeoutSeconds = 10): Promise<void> {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);
  await container.restart({ t: timeoutSeconds });
}

export async function removeContainer(containerId: string, force = true): Promise<void> {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);
  try {
    await container.remove({ force });
  } catch (error) {
    console.error(`[Docker] Failed to remove container ${containerId}:`, error);
  }
}

export async function getContainerLogs(
  containerId: string,
  tail = 100
): Promise<string> {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);
  try {
    const buffer = await container.logs({
      stdout: true,
      stderr: true,
      tail,
      timestamps: true,
    });
    return buffer.toString("utf8");
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Failed to retrieve logs";
    return `[Docker Error] ${errMsg}`;
  }
}

export async function getContainerStats(
  containerId: string
): Promise<ContainerStatsResult | null> {
  const docker = getDockerClient();
  const container = docker.getContainer(containerId);

  try {
    const statsStream = (await container.stats({ stream: false })) as unknown as {
      cpu_stats: {
        cpu_usage: { total_usage: number };
        system_cpu_usage?: number;
        online_cpus?: number;
      };
      precpu_stats: {
        cpu_usage: { total_usage: number };
        system_cpu_usage?: number;
      };
      memory_stats: {
        usage?: number;
        limit?: number;
      };
      networks?: Record<string, { rx_bytes: number; tx_bytes: number }>;
      pids_stats?: { current?: number };
    };

    if (!statsStream || !statsStream.cpu_stats) {
      return null;
    }

    // Calculate CPU %
    let cpuPercent = 0;
    const cpuDelta =
      statsStream.cpu_stats.cpu_usage.total_usage -
      (statsStream.precpu_stats?.cpu_usage?.total_usage || 0);
    const systemDelta =
      (statsStream.cpu_stats.system_cpu_usage || 0) -
      (statsStream.precpu_stats?.system_cpu_usage || 0);
    const onlineCpus = statsStream.cpu_stats.online_cpus || 1;

    if (systemDelta > 0 && cpuDelta > 0) {
      cpuPercent = Math.round(((cpuDelta / systemDelta) * onlineCpus * 100) * 10) / 10;
    }

    // Calculate Memory %
    const memUsage = statsStream.memory_stats?.usage || 0;
    const memLimit = statsStream.memory_stats?.limit || 1;
    const memPercent = Math.round(((memUsage / memLimit) * 100) * 10) / 10;

    // Calculate Network I/O
    let rxBytes = 0;
    let txBytes = 0;
    if (statsStream.networks) {
      for (const net of Object.values(statsStream.networks)) {
        rxBytes += net.rx_bytes || 0;
        txBytes += net.tx_bytes || 0;
      }
    }

    return {
      cpuPercent,
      memoryUsageBytes: memUsage,
      memoryLimitBytes: memLimit,
      memoryPercent: memPercent,
      networkRxBytes: rxBytes,
      networkTxBytes: txBytes,
      pidsCount: statsStream.pids_stats?.current || 0,
    };
  } catch {
    return null;
  }
}
