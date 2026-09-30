"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Plus,
  Globe,
  GitBranch,
  Cpu,
  HardDrive,
  Search,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateProjectModal } from "./create-project-modal";
import { formatDate } from "@/lib/utils";

interface ProjectItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  repositoryUrl: string;
  branch: string;
  runtime: string;
  status: string;
  domain: string | null;
  cpuLimit: number;
  memoryLimit: number;
  updatedAt: string | Date;
  _count: {
    deployments: number;
    domains: number;
    environmentVariables: number;
  };
}

interface ProjectsViewProps {
  initialProjects: ProjectItem[];
}

export function ProjectsView({ initialProjects }: ProjectsViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = initialProjects.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      p.repositoryUrl.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Projects</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage your Git-backed applications and container workloads
          </p>
        </div>
        <Button size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Create Project
        </Button>
      </div>

      {/* Filter / Search Bar */}
      {initialProjects.length > 0 && (
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Filter projects by name or repo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      )}

      {/* Projects Grid */}
      {initialProjects.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 mb-3 border border-zinc-800">
            <FolderGit2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No projects found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1 mb-6">
            You have not created any projects yet. Connect a GitHub or Git repository to deploy your first service.
          </p>
          <Button size="sm" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" />
            Create Project
          </Button>
        </Card>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-xs text-zinc-400 border border-zinc-800 rounded-lg">
          No projects match your search query &quot;{search}&quot;.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="transition-all hover:border-zinc-700 h-full flex flex-col justify-between cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-white group-hover:text-zinc-200">
                        {project.name}
                      </CardTitle>
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
                    <span className="uppercase font-mono text-[10px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-300">
                      {project.runtime}
                    </span>
                    <span>{project._count.deployments} deployments</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
