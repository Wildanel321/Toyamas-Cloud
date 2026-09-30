import os from "os";
import fs from "fs";

export interface SystemMetrics {
  hostname: string;
  platform: string;
  arch: string;
  nodeVersion: string;
  uptimeSeconds: number;
  cpuModel: string;
  cpuCores: number;
  cpuUsagePercent: number;
  totalMemoryBytes: number;
  freeMemoryBytes: number;
  usedMemoryBytes: number;
  memoryUsagePercent: number;
  loadAvg: number[];
}

function calculateCpuUsage(): number {
  const cpus = os.cpus();
  if (!cpus || cpus.length === 0) return 0;

  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type in cpu.times) {
      totalTick += cpu.times[type as keyof typeof cpu.times];
    }
    totalIdle += cpu.times.idle;
  }

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - (100 * idle) / (total || 1);

  return Math.min(100, Math.max(0, Math.round(usage * 10) / 10));
}

export function getSystemMetrics(): SystemMetrics {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent =
    totalMemory > 0
      ? Math.round(((usedMemory / totalMemory) * 100) * 10) / 10
      : 0;

  const cpus = os.cpus();
  const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : "Unknown CPU";

  return {
    hostname: os.hostname(),
    platform: `${os.type()} ${os.release()}`,
    arch: os.arch(),
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(os.uptime()),
    cpuModel,
    cpuCores: cpus ? cpus.length : 1,
    cpuUsagePercent: calculateCpuUsage(),
    totalMemoryBytes: totalMemory,
    freeMemoryBytes: freeMemory,
    usedMemoryBytes: usedMemory,
    memoryUsagePercent,
    loadAvg: os.loadavg(),
  };
}
