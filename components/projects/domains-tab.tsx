"use client";

import { useState } from "react";
import { Globe, Plus, Trash2, ShieldCheck, Lock, ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DomainItem {
  id: string;
  hostname: string;
  status: string;
  sslStatus: string;
  createdAt: string | Date;
}

interface DomainsTabProps {
  projectId: string;
  initialDomains: DomainItem[];
}

export function DomainsTab({ projectId, initialDomains }: DomainsTabProps) {
  const [domains, setDomains] = useState<DomainItem[]>(initialDomains);
  const [newHostname, setNewHostname] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newHostname.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/domains`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostname: newHostname.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add domain");
        setIsSubmitting(false);
        return;
      }

      setDomains((prev) => [...prev, data.domain]);
      setNewHostname("");
      setIsSubmitting(false);
    } catch {
      setError("Network error adding domain");
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (domainId: string, hostname: string) => {
    if (!confirm(`Are you sure you want to detach domain '${hostname}'?`)) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/domains?domainId=${domainId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setDomains((prev) => prev.filter((d) => d.id !== domainId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-white">Custom Domains & Routing</h3>
        <p className="text-xs text-zinc-400 mt-0.5">
          Map custom domains or subdomains to this application container
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Add Domain Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
            <div className="w-full sm:flex-1 space-y-1">
              <label className="font-medium text-zinc-300">Hostname</label>
              <Input
                placeholder="app.example.com or sub.wildanstore.my.id"
                value={newHostname}
                onChange={(e) => setNewHostname(e.target.value)}
                required
                className="font-mono text-xs"
              />
            </div>
            <Button type="submit" size="sm" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Attach Domain
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Domain List */}
      <Card className="divide-y divide-zinc-800/80 overflow-hidden">
        {domains.map((dom) => (
          <div key={dom.id} className="flex items-center justify-between p-4 text-xs">
            <div className="flex items-center gap-3">
              <Globe className="h-4 w-4 text-zinc-400" />
              <div>
                <a
                  href={`https://${dom.hostname}`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono font-medium text-zinc-200 hover:text-white hover:underline flex items-center gap-1"
                >
                  {dom.hostname}
                  <ExternalLink className="h-3 w-3 text-zinc-500" />
                </a>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Point DNS A record to your VPS Public IPv4
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={dom.sslStatus === "ACTIVE" ? "success" : "warning"}>
                <Lock className="h-3 w-3 mr-1" />
                {dom.sslStatus === "ACTIVE" ? "SSL Active" : "SSL Pending"}
              </Badge>
              <button
                onClick={() => handleDelete(dom.id, dom.hostname)}
                className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                title="Detach Domain"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
