import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderGit2, Plus, Globe, GitBranch, Cpu, HardDrive } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          deployments: true,
          domains: true,
          environmentVariables: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Projects</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your Git-backed applications and container deployments
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Create Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 mb-3 border border-zinc-800">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No projects found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-6">
            You have not created any projects yet. Connect a GitHub or Git repository to deploy your first service.
          </p>
          <Button size="sm">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="transition-all hover:border-zinc-700">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">{project.name}</CardTitle>
                    <CardDescription className="mt-1 font-mono text-xs text-zinc-400 truncate max-w-[200px]">
                      {project.repositoryUrl}
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

              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <GitBranch className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{project.branch}</span>
                  <span className="text-zinc-600">•</span>
                  <Globe className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="truncate">{project.domain || `${project.slug}.wildanstore.my.id`}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-3 text-xs text-zinc-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{project.cpuLimit} vCPU</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <HardDrive className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{project.memoryLimit} MB RAM</span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-800/80 pt-3 text-[11px] text-zinc-400">
                  <span>{project._count.deployments} deployments</span>
                  <span>Updated {formatDate(project.updatedAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
