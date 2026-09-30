"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderGit2,
  Rocket,
  ScrollText,
  KeyRound,
  Globe,
  Settings,
  ArrowLeft,
  Play,
  RotateCw,
  Square,
  ExternalLink,
  Cpu,
  HardDrive,
  GitBranch,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnvironmentTab } from "./environment-tab";
import { DomainsTab } from "./domains-tab";
import { SettingsTab } from "./settings-tab";
import { formatDate } from "@/lib/utils";

interface ProjectDetailsProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    repositoryUrl: string;
    branch: string;
    runtime: string;
    status: string;
    containerId: string | null;
    containerName: string | null;
    containerPort: number;
    publicPort: number | null;
    domain: string | null;
    cpuLimit: number;
    memoryLimit: number;
    autoDeploy: boolean;
    webhookSecret: string | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    domains: {
      id: string;
      hostname: string;
      status: string;
      sslStatus: string;
      createdAt: string | Date;
    }[];
    environmentVariables: {
      id: string;
      key: string;
      value: string;
      isSecret: boolean;
      createdAt: string | Date;
    }[];
    deployments: {
      id: string;
      commitHash: string | null;
      commitMessage: string | null;
      status: "QUEUED" | "BUILDING" | "DEPLOYING" | "RUNNING" | "FAILED" | "CANCELLED";
      trigger: string;
      startedAt: string | Date | null;
      finishedAt: string | Date | null;
      buildLog: string | null;
      errorMessage: string | null;
      createdAt: string | Date;
    }[];
  };
}

export function ProjectDetailView({ project }: ProjectDetailsProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "deployments" | "logs" | "environment" | "domains" | "settings"
  >("overview");

  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(
    project.deployments.length > 0 ? project.deployments[0] : null
  );

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/deploy`, {
        method: "POST",
      });
      if (res.ok) {
        window.location.reload();
      }
    } finally {
      setIsDeploying(false);
    }
  };

  const tabs = [
    { id: "overview", name: "Overview", icon: FolderGit2 },
    { id: "deployments", name: "Deployments", icon: Rocket },
    { id: "logs", name: "Runtime Logs", icon: ScrollText },
    { id: "environment", name: "Environment", icon: KeyRound },
    { id: "domains", name: "Domains", icon: Globe },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Top Bar with Back & Deploy CTA */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold tracking-tight text-white">
                {project.name}
              </h2>
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
            <p className="text-xs text-zinc-400 font-mono mt-0.5">
              {project.domain || `${project.slug}.wildanstore.my.id`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href={`https://${project.domain || `${project.slug}.wildanstore.my.id`}`}
            target="_blank"
            rel="noreferrer"
          >
            <Button variant="outline" size="sm">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              Visit App
            </Button>
          </a>
          <Button size="sm" onClick={handleDeploy} disabled={isDeploying}>
            {isDeploying ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
            ) : (
              <Rocket className="h-3.5 w-3.5 mr-1.5" />
            )}
            Deploy Latest
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 overflow-x-auto pb-px">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-zinc-100 text-white font-semibold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{t.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info (2 cols) */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Project Specifications</CardTitle>
                <CardDescription>Git repository, runtime configuration, and container parameters</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  <div className="space-y-1">
                    <span className="text-zinc-400">Git Repository</span>
                    <p className="font-mono text-zinc-200 truncate">{project.repositoryUrl}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-400">Branch</span>
                    <p className="font-mono text-zinc-200">{project.branch}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-400">Runtime Engine</span>
                    <p className="font-mono uppercase text-zinc-200">{project.runtime}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-400">Container Port</span>
                    <p className="font-mono text-zinc-200">{project.containerPort}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-400">Allocated CPU</span>
                    <p className="font-mono text-zinc-200">{project.cpuLimit} vCPU</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-zinc-400">Allocated RAM</span>
                    <p className="font-mono text-zinc-200">{project.memoryLimit} MB</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Container Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Active Container Instance</CardTitle>
                <CardDescription>Docker container status and networking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 font-mono">
                    <span className="text-zinc-400">Container ID:</span>
                    <span className="text-zinc-200">
                      {project.containerId ? project.containerId.substring(0, 12) : "Not running"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2 font-mono">
                    <span className="text-zinc-400">Container Name:</span>
                    <span className="text-zinc-200">
                      {project.containerName || `toyamas-${project.slug}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono">
                    <span className="text-zinc-400">Proxy Upstream:</span>
                    <span className="text-zinc-200">
                      http://{project.containerName || `toyamas-${project.slug}`}:{project.containerPort}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Side Info (1 col) */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Latest Deployment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                {project.deployments.length === 0 ? (
                  <p className="text-zinc-500 font-mono">No deployments yet</p>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">Status:</span>
                      <Badge
                        variant={
                          project.deployments[0].status === "RUNNING"
                            ? "success"
                            : project.deployments[0].status === "FAILED"
                            ? "destructive"
                            : "warning"
                        }
                      >
                        {project.deployments[0].status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between font-mono">
                      <span className="text-zinc-400">Commit:</span>
                      <span className="text-zinc-200">
                        {project.deployments[0].commitHash
                          ? project.deployments[0].commitHash.substring(0, 7)
                          : "Manual"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Deployed:</span>
                      <span>{formatDate(project.deployments[0].createdAt)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "deployments" && (
        <div className="space-y-6">
          <Card className="divide-y divide-zinc-800/80 overflow-hidden">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-zinc-400 bg-zinc-900/60 uppercase tracking-wider">
              <div className="col-span-4">Commit / Trigger</div>
              <div className="col-span-3">Status</div>
              <div className="col-span-3">Timestamp</div>
              <div className="col-span-2 text-right">Log View</div>
            </div>

            {project.deployments.length === 0 ? (
              <div className="p-8 text-center text-xs text-zinc-500">
                No deployment history found.
              </div>
            ) : (
              project.deployments.map((dep) => (
                <div key={dep.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center text-xs">
                  <div className="col-span-4">
                    <p className="font-medium text-zinc-200 font-mono">
                      {dep.commitHash ? dep.commitHash.substring(0, 7) : "Manual Trigger"}
                    </p>
                    <p className="text-[11px] text-zinc-400">{dep.trigger}</p>
                  </div>
                  <div className="col-span-3">
                    <Badge
                      variant={
                        dep.status === "RUNNING"
                          ? "success"
                          : dep.status === "FAILED"
                          ? "destructive"
                          : "warning"
                      }
                    >
                      {dep.status}
                    </Badge>
                  </div>
                  <div className="col-span-3 text-zinc-400 font-mono text-[11px]">
                    {formatDate(dep.createdAt)}
                  </div>
                  <div className="col-span-2 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDeployment(dep)}
                    >
                      View Logs
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card>

          {/* Selected Deployment Log Viewer */}
          {selectedDeployment && (
            <Card className="border-zinc-700 bg-zinc-950">
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-xs font-semibold font-mono">
                    Build Logs — {selectedDeployment.id}
                  </CardTitle>
                  <CardDescription className="text-[11px]">
                    Deployment trigger: {selectedDeployment.trigger}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    selectedDeployment.status === "RUNNING"
                      ? "success"
                      : selectedDeployment.status === "FAILED"
                      ? "destructive"
                      : "warning"
                  }
                >
                  {selectedDeployment.status}
                </Badge>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-black/90 rounded-md font-mono text-[11px] text-zinc-300 max-h-96 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {selectedDeployment.buildLog || "No logs recorded for this deployment stage."}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "logs" && (
        <Card className="border-zinc-800 bg-zinc-950">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Live Container Runtime Logs</CardTitle>
            <CardDescription className="text-[11px]">Streaming from docker logs stdout/stderr</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-black/90 rounded-md font-mono text-[11px] text-emerald-400 min-h-[300px] overflow-y-auto">
              <p className="text-zinc-500 font-mono">[docker daemon connection initialized]</p>
              <p className="text-zinc-400 mt-1">Listening on socket /var/run/docker.sock for container toyamas-{project.slug}...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === "environment" && (
        <EnvironmentTab
          projectId={project.id}
          initialVariables={project.environmentVariables}
        />
      )}

      {activeTab === "domains" && (
        <DomainsTab
          projectId={project.id}
          initialDomains={project.domains}
        />
      )}

      {activeTab === "settings" && (
        <SettingsTab project={project} />
      )}
    </div>
  );
}
