import { describe, it, expect } from "vitest";
import { getDockerClient, checkDockerConnection } from "@/lib/docker/client";
import { TOYAMAS_DOCKER_NETWORK } from "@/lib/docker/network";

describe("Docker Integration & Configuration", () => {
  it("should initialize a docker client instance", () => {
    const client = getDockerClient();
    expect(client).toBeDefined();
    expect(typeof client.listContainers).toBe("function");
  });

  it("should define the correct Docker network name", () => {
    expect(TOYAMAS_DOCKER_NETWORK).toBe("toyamas-network");
  });

  it("should test Docker connection gracefully", async () => {
    const status = await checkDockerConnection();
    expect(status).toBeDefined();
    expect(typeof status.connected).toBe("boolean");
  });
});
