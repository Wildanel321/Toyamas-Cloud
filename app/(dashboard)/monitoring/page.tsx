import { getSystemMetrics } from "@/lib/system/info";
import { formatBytes } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Cpu, HardDrive, Server, Activity, Clock, Layers, ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export default function MonitoringPage() {
  const metrics = getSystemMetrics();

  const uptimeHours = Math.floor(metrics.uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((metrics.uptimeSeconds % 3600) / 60);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">System Metrics & Resources</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Live telemetry from host VPS infrastructure and container runtime
        </p>
      </div>

      {/* Metrics Top Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* CPU */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {metrics.cpuUsagePercent}%
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.cpuUsagePercent)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
              {metrics.cpuCores} cores available
            </p>
          </CardContent>
        </Card>

        {/* RAM */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">RAM Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {metrics.memoryUsagePercent}%
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-blue-400 transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.memoryUsagePercent)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
              {formatBytes(metrics.usedMemoryBytes)} / {formatBytes(metrics.totalMemoryBytes)}
            </p>
          </CardContent>
        </Card>

        {/* Free Memory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Free Memory</CardTitle>
            <Layers className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {formatBytes(metrics.freeMemoryBytes)}
            </div>
            <p className="text-[10px] text-zinc-400 mt-2 font-mono">
              Available for application containers
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
              Continuous runtime
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Host Specs & Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Host System Specification</CardTitle>
          <CardDescription>
            Detailed host properties and hardware abstraction layer info
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 text-xs">
            <div className="flex justify-between border-b border-zinc-800/80 py-2">
              <span className="text-zinc-400">Hostname</span>
              <span className="font-mono text-zinc-200">{metrics.hostname}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 py-2">
              <span className="text-zinc-400">Operating System</span>
              <span className="font-mono text-zinc-200">{metrics.platform}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 py-2">
              <span className="text-zinc-400">Architecture</span>
              <span className="font-mono text-zinc-200">{metrics.arch}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 py-2">
              <span className="text-zinc-400">Node.js Runtime</span>
              <span className="font-mono text-zinc-200">{metrics.nodeVersion}</span>
            </div>
            <div className="flex justify-between border-b border-zinc-800/80 py-2 sm:col-span-2">
              <span className="text-zinc-400">CPU Model</span>
              <span className="font-mono text-zinc-200">{metrics.cpuModel}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
