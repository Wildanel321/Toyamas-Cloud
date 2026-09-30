import Docker from "dockerode";
import os from "os";

let dockerInstance: Docker | null = null;

export function getDockerClient(): Docker {
  if (dockerInstance) {
    return dockerInstance;
  }

  const isWindows = os.platform() === "win32";
  const customSocket = process.env.DOCKER_SOCKET_PATH;

  if (customSocket) {
    dockerInstance = new Docker({ socketPath: customSocket });
  } else if (isWindows) {
    dockerInstance = new Docker({ socketPath: "//./pipe/docker_engine" });
  } else {
    dockerInstance = new Docker({ socketPath: "/var/run/docker.sock" });
  }

  return dockerInstance;
}

export async function checkDockerConnection(): Promise<{
  connected: boolean;
  version?: string;
  containers?: number;
  error?: string;
}> {
  try {
    const docker = getDockerClient();
    const [pingRes, versionRes, infoRes] = await Promise.all([
      docker.ping(),
      docker.version(),
      docker.info(),
    ]);

    return {
      connected: true,
      version: versionRes.Version,
      containers: infoRes.Containers,
    };
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Docker daemon unreachable";
    return {
      connected: false,
      error: errMsg,
    };
  }
}
