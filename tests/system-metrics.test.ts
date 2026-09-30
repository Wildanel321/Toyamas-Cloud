import { describe, it, expect } from "vitest";
import { getSystemMetrics } from "@/lib/system/info";

describe("System Telemetry & Metrics", () => {
  it("should return valid host metrics with real data", () => {
    const metrics = getSystemMetrics();

    expect(metrics).toBeDefined();
    expect(metrics.hostname).toBeDefined();
    expect(typeof metrics.hostname).toBe("string");
    expect(metrics.cpuCores).toBeGreaterThan(0);
    expect(metrics.totalMemoryBytes).toBeGreaterThan(0);
    expect(metrics.usedMemoryBytes).toBeGreaterThanOrEqual(0);
    expect(metrics.freeMemoryBytes).toBeGreaterThanOrEqual(0);
    expect(metrics.memoryUsagePercent).toBeGreaterThanOrEqual(0);
    expect(metrics.memoryUsagePercent).toBeLessThanOrEqual(100);
    expect(metrics.uptimeSeconds).toBeGreaterThanOrEqual(0);
  });
});
