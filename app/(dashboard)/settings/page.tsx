import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Shield, Server, Terminal, ScrollText } from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const auditLogs = await prisma.auditLog.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-white">Platform Settings</h2>
        <p className="text-xs text-zinc-400 mt-0.5">
          Configure cluster infrastructure, default runtime parameters, and security policies
        </p>
      </div>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-zinc-400" />
            <CardTitle className="text-sm">General Configuration</CardTitle>
          </div>
          <CardDescription>
            Core cluster domain and routing defaults
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Base Wildcard Domain</label>
              <Input
                defaultValue="wildanstore.my.id"
                disabled
                className="font-mono bg-zinc-950/80 text-zinc-400"
              />
              <p className="text-[10px] text-zinc-400">Configured via environment variables</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Control Plane URL</label>
              <Input
                defaultValue="https://wildanstore.my.id"
                disabled
                className="font-mono bg-zinc-950/80 text-zinc-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Docker Runtime Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-zinc-400" />
            <CardTitle className="text-sm">Container Runtime & Reverse Proxy</CardTitle>
          </div>
          <CardDescription>
            Socket connections and internal reverse proxy hooks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Docker Engine Socket</label>
              <Input
                defaultValue={process.env.DOCKER_SOCKET_PATH || "/var/run/docker.sock"}
                disabled
                className="font-mono bg-zinc-950/80 text-zinc-400"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Caddy Admin API</label>
              <Input
                defaultValue="http://localhost:2019"
                disabled
                className="font-mono bg-zinc-950/80 text-zinc-400"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-zinc-400" />
            <CardTitle className="text-sm">Audit Trail</CardTitle>
          </div>
          <CardDescription>
            Immutable log of administrative actions, authentication, and state modifications
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {auditLogs.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="font-mono text-[11px] bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                      {log.action}
                    </span>
                    <div>
                      <p className="font-medium text-zinc-200">
                        {log.user ? log.user.name : "System / Anonymous"}
                      </p>
                      <p className="text-[11px] text-zinc-400 font-mono">
                        Target: {log.resource} {log.resourceId ? `(${log.resourceId})` : ""}
                      </p>
                    </div>
                  </div>
                  <span className="text-zinc-400 font-mono text-[11px]">
                    {formatDate(log.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
