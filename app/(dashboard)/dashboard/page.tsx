import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSystemMetrics } from "@/lib/system/info";
import { formatBytes, formatDate } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FolderGit2,
  Rocket,
  Activity,
  Cpu,
  HardDrive,
  Server,
  Plus,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage() {
  // Query real data from PostgreSQL
  const [
    totalProjects,
    runningProjects,
    totalDeployments,
    failedDeployments,
    recentDeployments,
    projects,
  ] = await Promise.all([
    prisma.project.count(),
    prisma.project.count({ where: { status: "RUNNING" } }),
    prisma.deployment.count(),
    prisma.deployment.count({ where: { status: "FAILED" } }),
    prisma.deployment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    prisma.project.findMany({
      take: 6,
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { deployments: true },
        },
      },
    }),
  ]);

  // Real host system metrics
  const metrics = getSystemMetrics();

  return (
    <div className="space-y-8">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Infrastructure Overview</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Real-time status of your self-hosted applications and host resources
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/monitoring">
            <Button variant="outline" size="sm">
              <Activity className="h-3.5 w-3.5 mr-1.5" />
              Metrics
            </Button>
          </Link>
          <Link href="/projects">
            <Button size="sm">
              <Plus className="h-3.5 w-3.5 mr-1" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Projects Metric */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Total Projects</CardTitle>
            <FolderGit2 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalProjects}</div>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-medium">{runningProjects} running</span>
              <span className="text-zinc-600">•</span>
              <span>{totalProjects - runningProjects} stopped</span>
            </p>
          </CardContent>
        </Card>

        {/* Deployments Metric */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Deployments</CardTitle>
            <Rocket className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalDeployments}</div>
            <p className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1.5">
              {failedDeployments > 0 ? (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-400" />
                  <span className="text-red-400 font-medium">{failedDeployments} failed</span>
                </>
              ) : (
                <>
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span className="text-zinc-400">0 failure alerts</span>
                </>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Real CPU Metric */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Host CPU Load</CardTitle>
            <Cpu className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {metrics.cpuUsagePercent}%
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-zinc-200 transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.cpuUsagePercent)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
              {metrics.cpuCores} vCPU • {metrics.cpuModel.split("@")[0].trim()}
            </p>
          </CardContent>
        </Card>

        {/* Real RAM Metric */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-medium text-zinc-400">Host Memory</CardTitle>
            <HardDrive className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white font-mono">
              {metrics.memoryUsagePercent}%
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full bg-zinc-200 transition-all duration-500"
                style={{ width: `${Math.min(100, metrics.memoryUsagePercent)}%` }}
              />
            </div>
            <p className="text-[10px] text-zinc-400 mt-1.5 font-mono">
              {formatBytes(metrics.usedMemoryBytes)} / {formatBytes(metrics.totalMemoryBytes)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Projects Grid & Recent Deployments */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Projects Section (2 cols) */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">Active Projects</h3>
            <Link
              href="/projects"
              className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1"
            >
              View all <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 mb-3 border border-zinc-800">
                <FolderGit2 className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-semibold text-white">No projects deployed yet</h4>
              <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-4">
                Connect a Git repository, configure environment variables, and deploy your first application to your VPS.
              </p>
              <Link href="/projects">
                <Button size="sm">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create First Project
                </Button>
              </Link>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project) => (
                <Card key={project.id} className="transition-all hover:border-zinc-700">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-sm font-semibold">{project.name}</CardTitle>
                        <CardDescription className="mt-0.5 font-mono">
                          {project.domain || `${project.slug}.wildanstore.my.id`}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          project.status === "RUNNING"
                            ? "success"
                            : project.status === "FAILED"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-zinc-400 border-t border-zinc-800/80 pt-3 mt-1">
                      <span className="font-mono text-[11px] uppercase bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                        {project.runtime}
                      </span>
                      <span>{project._count.deployments} deployments</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Deployments Section (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-zinc-200">Recent Deployments</h3>
            <Link
              href="/deployments"
              className="text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1"
            >
              View history <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>

          <Card className="divide-y divide-zinc-800/80">
            {recentDeployments.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-400">
                <Clock className="h-6 w-6 mx-auto mb-2 text-zinc-600" />
                <span>No deployment activity recorded yet</span>
              </div>
            ) : (
              recentDeployments.map((dep) => (
                <div key={dep.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    {dep.status === "RUNNING" ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : dep.status === "FAILED" ? (
                      <XCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                    ) : (
                      <Loader2 className="h-4 w-4 text-amber-400 animate-spin shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-xs font-medium text-zinc-200">
                        {dep.project.name}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        {dep.commitHash ? dep.commitHash.substring(0, 7) : "Manual Trigger"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        dep.status === "RUNNING"
                          ? "success"
                          : dep.status === "FAILED"
                          ? "destructive"
                          : "warning"
                      }
                      className="text-[10px]"
                    >
                      {dep.status}
                    </Badge>
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {formatDate(dep.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
