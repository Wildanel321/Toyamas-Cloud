import { prisma } from "@/lib/prisma";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, Plus, ShieldCheck, Lock, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  const domains = await prisma.domain.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      project: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-white">Domains & SSL</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure hostnames, wildcard routing, and automated Caddy TLS certificates
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-3.5 w-3.5 mr-1" />
          Add Custom Domain
        </Button>
      </div>

      {/* Base Wildcard Domain Info Card */}
      <Card className="border-zinc-800 bg-zinc-900/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-400" />
            <CardTitle className="text-sm">Default Wildcard Routing</CardTitle>
          </div>
          <CardDescription>
            All deployed services are automatically routed under the primary cluster domain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-xs">
            <div className="flex items-center gap-2 font-mono text-zinc-200">
              <span className="text-emerald-400">*.wildanstore.my.id</span>
              <span className="text-zinc-600">→</span>
              <span className="text-zinc-400">Caddy Reverse Proxy (Port 80/443)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success" className="gap-1 text-[10px]">
                <Lock className="h-3 w-3" />
                Automatic TLS Active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Domains list */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-200">Configured Hostnames</h3>

        {domains.length === 0 ? (
          <Card className="p-8 text-center text-xs text-zinc-400 border-dashed">
            <Globe className="h-6 w-6 mx-auto mb-2 text-zinc-600" />
            <p className="text-zinc-300 font-medium">No custom domains added</p>
            <p className="text-zinc-500 mt-0.5">
              Projects will use their default <span className="font-mono text-zinc-400">[slug].wildanstore.my.id</span> subdomains.
            </p>
          </Card>
        ) : (
          <Card className="divide-y divide-zinc-800/80">
            {domains.map((dom) => (
              <div key={dom.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="h-4 w-4 text-zinc-400" />
                  <div>
                    <p className="text-xs font-medium text-white font-mono">{dom.hostname}</p>
                    <p className="text-[11px] text-zinc-400">Attached to {dom.project.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={dom.sslStatus === "ACTIVE" ? "success" : "warning"}>
                    {dom.sslStatus === "ACTIVE" ? "SSL Active" : "SSL Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
