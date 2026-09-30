"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FolderGit2,
  GitBranch,
  Globe,
  Cpu,
  HardDrive,
  Layers,
  X,
  Loader2,
  AlertCircle,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/projects/slug";

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RUNTIMES = [
  { id: "nodejs", name: "Node.js", desc: "npm / yarn / pnpm", port: 3000 },
  { id: "nextjs", name: "Next.js", desc: "React SSR / Static", port: 3000 },
  { id: "python", name: "Python", desc: "FastAPI / Flask / WSGI", port: 8000 },
  { id: "laravel", name: "Laravel", desc: "PHP & Composer", port: 8000 },
  { id: "dockerfile", name: "Dockerfile", desc: "Custom image build", port: 8080 },
];

const RESOURCE_PRESETS = [
  { id: "small", name: "Small", cpu: 0.25, memory: 256, desc: "256 MB / 0.25 vCPU" },
  { id: "normal", name: "Normal", cpu: 0.5, memory: 512, desc: "512 MB / 0.5 vCPU" },
  { id: "large", name: "Large", cpu: 1.0, memory: 1024, desc: "1 GB / 1.0 vCPU" },
];

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [branch, setBranch] = useState("main");
  const [runtime, setRuntime] = useState("nodejs");
  const [containerPort, setContainerPort] = useState(3000);
  const [preset, setPreset] = useState("normal");
  const [cpuLimit, setCpuLimit] = useState(0.5);
  const [memoryLimit, setMemoryLimit] = useState(512);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    setSlug(slugify(val));
  };

  const handleRuntimeChange = (rId: string) => {
    setRuntime(rId);
    const selected = RUNTIMES.find((r) => r.id === rId);
    if (selected) {
      setContainerPort(selected.port);
    }
  };

  const handlePresetChange = (pId: string) => {
    setPreset(pId);
    const selected = RESOURCE_PRESETS.find((p) => p.id === pId);
    if (selected) {
      setCpuLimit(selected.cpu);
      setMemoryLimit(selected.memory);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          repositoryUrl,
          branch,
          runtime,
          containerPort: Number(containerPort),
          cpuLimit: Number(cpuLimit),
          memoryLimit: Number(memoryLimit),
          description,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create project");
        setIsLoading(false);
        return;
      }

      onClose();
      router.push(`/projects/${data.project.id}`);
      router.refresh();
    } catch {
      setError("An unexpected network error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl rounded-xl border border-zinc-800 bg-[#0c0c0e] p-6 shadow-2xl text-zinc-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4 mb-5">
          <div className="flex items-center gap-2">
            <FolderGit2 className="h-5 w-5 text-zinc-200" />
            <h3 className="text-base font-semibold">Create New Project</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Project Name & Slug */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="font-medium text-zinc-300">Project Name</label>
              <Input
                type="text"
                placeholder="e.g. DagangKu API"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-zinc-300">Slug (Subdomain)</label>
              <Input
                type="text"
                placeholder="dagangku"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
                className="font-mono"
              />
              <p className="text-[11px] text-zinc-500 font-mono">
                {slug ? `${slug}.wildanstore.my.id` : "subdomain.wildanstore.my.id"}
              </p>
            </div>
          </div>

          {/* Git Repository & Branch */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-medium text-zinc-300 flex items-center gap-1">
                <Globe className="h-3 w-3 text-zinc-400" />
                Git Repository URL (HTTPS)
              </label>
              <Input
                type="url"
                placeholder="https://github.com/example/dagangku.git"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="font-medium text-zinc-300 flex items-center gap-1">
                <GitBranch className="h-3 w-3 text-zinc-400" />
                Branch
              </label>
              <Input
                type="text"
                placeholder="main"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                required
                className="font-mono"
              />
            </div>
          </div>

          {/* Runtime Selection */}
          <div className="space-y-2">
            <label className="font-medium text-zinc-300">Runtime Environment</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {RUNTIMES.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => handleRuntimeChange(r.id)}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    runtime === r.id
                      ? "border-zinc-200 bg-zinc-800 text-white shadow-xs"
                      : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <span className="font-semibold text-xs">{r.name}</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5 truncate w-full">{r.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Resource Limit Presets */}
          <div className="space-y-2">
            <label className="font-medium text-zinc-300">Resource Sandboxing Limits</label>
            <div className="grid grid-cols-3 gap-2">
              {RESOURCE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => handlePresetChange(p.id)}
                  className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all ${
                    preset === p.id
                      ? "border-zinc-200 bg-zinc-800 text-white"
                      : "border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                  }`}
                >
                  <span className="font-semibold text-xs">{p.name}</span>
                  <span className="text-[10px] text-zinc-400 mt-0.5">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Container Port & Description */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <label className="font-medium text-zinc-300">Internal Port</label>
              <Input
                type="number"
                value={containerPort}
                onChange={(e) => setContainerPort(Number(e.target.value))}
                required
                className="font-mono"
              />
            </div>
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-medium text-zinc-300">Description (Optional)</label>
              <Input
                type="text"
                placeholder="Production API backend"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-zinc-800 pt-4 mt-6">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating Project...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
