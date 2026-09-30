import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, CheckCircle2, XCircle, Loader2, GitCommit, Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DeploymentsPage() {
  const deployments = await prisma.deployment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          slug: true,
          runtime: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Deployments</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          History and status of builds, container instances, and rollouts
        </p>
      </div>

      {deployments.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-16 text-center border-dashed">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-zinc-400 mb-3 border border-zinc-800">
            <Rocket className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No deployments recorded</h3>
          <p className="text-xs text-zinc-400 max-w-sm mt-1">
            When you deploy a project manually or via GitHub webhook, the full build and runtime deployment logs will appear here.
          </p>
        </Card>
      ) : (
        <Card className="divide-y divide-zinc-800/80 overflow-hidden">
          <div className="grid grid-cols-12 gap-4 px-6 py-3 text-xs font-semibold text-zinc-400 bg-zinc-900/60 uppercase tracking-wider">
            <div className="col-span-4">Project / Commit</div>
            <div className="col-span-2">Trigger</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-3 text-right">Timestamp</div>
          </div>
          {deployments.map((dep) => (
            <div
              key={dep.id}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-zinc-900/40 transition-colors"
            >
              <div className="col-span-4 flex items-center gap-3">
                {dep.status === "RUNNING" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                ) : dep.status === "FAILED" ? (
                  <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                ) : (
                  <Loader2 className="h-4 w-4 text-amber-400 animate-spin shrink-0" />
                )}
                <div>
                  <p className="text-xs font-medium text-white">{dep.project.name}</p>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-400 mt-0.5">
                    <GitCommit className="h-3 w-3" />
                    <span>{dep.commitHash ? dep.commitHash.substring(0, 7) : "Manual Trigger"}</span>
                  </div>
                </div>
              </div>

              <div className="col-span-2">
                <span className="inline-block font-mono text-[11px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                  {dep.trigger}
                </span>
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

              <div className="col-span-3 text-right text-xs text-zinc-400 font-mono">
                {formatDate(dep.createdAt)}
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
