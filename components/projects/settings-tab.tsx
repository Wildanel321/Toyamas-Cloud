"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, Cpu, HardDrive, GitBranch, Save, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface ProjectData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  repositoryUrl: string;
  branch: string;
  runtime: string;
  containerPort: number;
  cpuLimit: number;
  memoryLimit: number;
  autoDeploy: boolean;
  webhookSecret: string | null;
}

interface SettingsTabProps {
  project: ProjectData;
}

export function SettingsTab({ project }: SettingsTabProps) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [branch, setBranch] = useState(project.branch);
  const [containerPort, setContainerPort] = useState(project.containerPort);
  const [cpuLimit, setCpuLimit] = useState(project.cpuLimit);
  const [memoryLimit, setMemoryLimit] = useState(project.memoryLimit);
  const [autoDeploy, setAutoDeploy] = useState(project.autoDeploy);
  const [description, setDescription] = useState(project.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          branch,
          containerPort: Number(containerPort),
          cpuLimit: Number(cpuLimit),
          memoryLimit: Number(memoryLimit),
          autoDeploy,
          description,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmName = prompt(
      `To confirm deletion, type the project slug '${project.slug}':`
    );
    if (confirmName !== project.slug) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/projects");
        router.refresh();
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">General Settings</CardTitle>
          <CardDescription>
            Update project identity, description, and branch tracking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4 text-xs">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-300">Project Name</label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-medium text-zinc-300">Git Branch</label>
                <Input
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  required
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-medium text-zinc-300">Description</label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional project notes"
              />
            </div>

            {/* Resources */}
            <div className="border-t border-zinc-800/80 pt-4 mt-4">
              <h4 className="font-semibold text-zinc-200 mb-3">Resource Sandboxing Limits</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-300">CPU Limit (vCPU)</label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="4.0"
                    value={cpuLimit}
                    onChange={(e) => setCpuLimit(Number(e.target.value))}
                    required
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-300">Memory Limit (MB)</label>
                  <Input
                    type="number"
                    step="64"
                    min="64"
                    max="8192"
                    value={memoryLimit}
                    onChange={(e) => setMemoryLimit(Number(e.target.value))}
                    required
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="font-medium text-zinc-300">Container Port</label>
                  <Input
                    type="number"
                    value={containerPort}
                    onChange={(e) => setContainerPort(Number(e.target.value))}
                    required
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-zinc-800/80 pt-4">
              <span className="text-[11px] text-emerald-400 font-medium">
                {saveSuccess ? "Changes saved successfully." : ""}
              </span>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Save className="h-3.5 w-3.5 mr-1" />
                )}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Webhook Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">GitHub Webhook Integration</CardTitle>
          <CardDescription>
            Configure automatic deployments on Git push events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-xs">
          <div className="space-y-1">
            <span className="font-medium text-zinc-400">Payload URL</span>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-2 font-mono text-zinc-300 select-all">
              https://wildanstore.my.id/api/webhooks/github
            </div>
          </div>
          <div className="space-y-1">
            <span className="font-medium text-zinc-400">Webhook Secret</span>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-2 font-mono text-zinc-300 select-all">
              {project.webhookSecret || "No secret generated"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-900/60 bg-red-950/10">
        <CardHeader>
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <CardTitle className="text-sm">Danger Zone</CardTitle>
          </div>
          <CardDescription className="text-red-400/80">
            Irreversible destructive actions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between pt-0">
          <div>
            <p className="text-xs font-semibold text-zinc-200">Delete this project</p>
            <p className="text-[11px] text-zinc-400">
              Permanently destroys this project, all deployment logs, and attached domains.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 mr-1" />
            )}
            Delete Project
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
