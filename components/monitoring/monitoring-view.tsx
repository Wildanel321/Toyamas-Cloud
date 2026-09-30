"use client";

import { useState, useEffect } from "react";
import {
  Cpu,
  HardDrive,
  Activity,
  Layers,
  Clock,
  Server,
  RefreshCw,
  Play,
  Pause,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatBytes } from "@/lib/utils";

interface HostMetrics {
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

interface ContainerMetric {
  projectId: string;
  projectName: string;
  slug: string;
  runtime: string;
  containerId: string;
  containerName: string;
  cpuLimit: number;
  memoryLimitMB: number;
  stats: {
    cpuPercent: number;
    memoryUsageBytes: number;
    memoryLimitBytes: number;
    memoryPercent: number;
    networkRxBytes: number;
    networkTxBytes: number;
    pidsCount: number;
  };
}

interface MonitoringViewProps {
  initialHost: HostMetrics;
}

export function MonitoringView({ initialHost }: MonitoringViewProps) {
  const [host, setHost] = useState<HostMetrics>(initialHost);
  const [containers, setContainers] = useState<ContainerMetric[]>([]);
  const [dockerStatus, setDockerStatus] = useState<{ connected: boolean; version?: string }>({
    connected: true,
  });
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchMetrics = async () => {
    setIsFetching(true);
    try {
      const res = await fetch("/api/system/monitoring");
      if (res.ok) {
        const data = await res.json();
        if (data.host) setHost(data.host);
        if (data.containers) setContainers(data.containers);
        if (data.docker) setDockerStatus(data.docker);
        setLastUpdated(new Date());
      }
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    if (!isAutoRefresh) return;
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const uptimeHours = Math.floor(host.uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((host.uptimeSeconds % 3600) / 60);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">System Metrics & Resources</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Live telemetry from host VPS infrastructure and container runtime
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="text-zinc-500 font-mono text-[11px]">
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
          >
            {isAutoRefresh ? (
              <>
                <Pause className="h-3 w-3 mr-1.5 text-amber-400" />
                Pause
              </>
            ) : (
              <>
                <Play className="h-3 w-3 mr-1.5 text-emerald-400" />
                Live (3s)
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isFetching}
          >
            <RefreshCw className={`h-3 w-3 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Host CPU */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Host CPU Load</CardTitle>
            <Cpu className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {host.cpuUsagePercent}%
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${Math.min(100, host.cpuUsagePercent)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
              {host.cpuCores} cores available
            </p>
          </CardContent>
        </Card>

        {/* Host RAM */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Host RAM Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {host.memoryUsagePercent}%
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-blue-400 transition-all duration-300"
                style={{ width: `${Math.min(100, host.memoryUsagePercent)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
              {formatBytes(host.usedMemoryBytes)} / {formatBytes(host.totalMemoryBytes)}
            </p>
          </CardContent>
        </Card>

        {/* Free Memory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Available Memory</CardTitle>
            <Layers className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {formatBytes(host.freeMemoryBytes)}
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 font-mono">
              Free memory for new containers
            </p>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Host Uptime</CardTitle>
            <Clock className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {uptimeHours}h {uptimeMinutes}m
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 font-mono">
              Load: {host.loadAvg?.map((n) => n.toFixed(2)).join(", ") || "0.00"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Container Telemetry Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Application Containers Telemetry</h3>
            <p className="text-xs text-zinc-400">Real-time resource utilization per container</p>
          </div>
          <Badge variant={dockerStatus.connected ? "success" : "destructive"}>
            Docker: {dockerStatus.connected ? "Connected" : "Disconnected"}
          </Badge>
        </div>

        {containers.length === 0 ? (
          <Card className="p-8 text-center text-xs text-zinc-400 border-dashed">
            <Server className="h-6 w-6 mx-auto mb-2 text-zinc-600" />
            <p className="text-zinc-300 font-medium">No application containers currently running</p>
            <p className="text-zinc-500 mt-0.5">
              Deploy a project to view container CPU, RAM, Network I/O, and process telemetry.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-zinc-800/80 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-zinc-400 bg-zinc-900/60 uppercase tracking-wider font-mono">
              <div className="col-span-4">Project / Container</div>
              <div className="col-span-2">CPU Load</div>
              <div className="col-span-3">Memory Usage / Limit</div>
              <div className="col-span-2">Network (Rx / Tx)</div>
              <div className="col-span-1 text-right">PIDs</div>
            </div>

            {containers.map((c) => (
              <div
                key={c.containerId}
                className="grid grid-cols-12 gap-4 px-6 py-4 items-center text-xs hover:bg-zinc-900/40 transition-colors"
              >
                <div className="col-span-4">
                  <p className="font-semibold text-white">{c.projectName}</p>
                  <p className="font-mono text-[11px] text-zinc-400 truncate">
                    {c.containerName} ({c.containerId.substring(0, 8)})
                  </p>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-zinc-200">
                      {c.stats.cpuPercent}%
                    </span>
                    <span className="text-[10px] text-zinc-500 font-mono">
                      / {c.cpuLimit} vCPU
                    </span>
                  </div>
                  <div className="mt-1 h-1 w-24 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-400"
                      style={{ width: `${Math.min(100, c.stats.cpuPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="col-span-3">
                  <div className="font-mono text-zinc-200">
                    {formatBytes(c.stats.memoryUsageBytes)} / {c.memoryLimitMB} MB
                  </div>
                  <div className="mt-1 h-1 w-32 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-400"
                      style={{ width: `${Math.min(100, c.stats.memoryPercent)}%` }}
                    />
                  </div>
                </div>

                <div className="col-span-2 font-mono text-[11px] text-zinc-400">
                  <span>↓ {formatBytes(c.stats.networkRxBytes)}</span>
                  <span className="text-zinc-600"> / </span>
                  <span>↑ {formatBytes(c.stats.networkTxBytes)}</span>
                </div>

                <div className="col-span-1 text-right font-mono text-zinc-300">
                  {c.stats.pidsCount}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Host Specs & Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Host VPS System Specification</CardTitle>
          <CardDescription>
            Target environment: Ubuntu Linux • 4 vCPU • 8 GB RAM • Docker Engine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="flex justify-between border-b border-zinc-800/80 py-2">
              <span className="text-zinc-400">Hostname</span>
              <span className="font-mono text-zinc-200">{host.hostname}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 py-2">
              <span className="text-zinc-400">Operating System</span>
              <span className="font-mono text-zinc-200">{host.platform}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 py-2">
              <span className="text-zinc-400">Architecture</span>
              <span className="font-mono text-zinc-200">{host.arch}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 py-2">
              <span className="text-zinc-400">Node.js Version</span>
              <span className="font-mono text-zinc-200">{host.nodeVersion}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 py-2 sm:col-span-2">
              <span className="text-zinc-400">CPU Model</span>
              <span className="font-mono text-zinc-200">{host.cpuModel}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
