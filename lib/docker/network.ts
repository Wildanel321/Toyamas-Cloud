import { getDockerClient } from "./client";

export const TOYAMAS_DOCKER_NETWORK = "toyamas-network";

export async function ensureToyamasNetwork(): Promise<string> {
  const docker = getDockerClient();
  try {
    const networks = await docker.listNetworks();
    const existing = networks.find((n) => n.Name === TOYAMAS_DOCKER_NETWORK);

    if (existing && existing.Id) {
      return existing.Id;
    }

    const newNetwork = await docker.createNetwork({
      Name: TOYAMAS_DOCKER_NETWORK,
      Driver: "bridge",
      CheckDuplicate: true,
      Attachable: true,
    });

    return newNetwork.id;
  } catch (error) {
    console.error("[Docker Network] Failed to ensure network:", error);
    // Return default bridge if network creation fails
    return "bridge";
  }
}
