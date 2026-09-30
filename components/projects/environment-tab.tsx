"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, Lock, Loader2, KeyRound, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface EnvVar {
  id: string;
  key: string;
  value: string;
  isSecret: boolean;
  createdAt: string | Date;
}

interface EnvironmentTabProps {
  projectId: string;
  initialVariables: EnvVar[];
}

export function EnvironmentTab({ projectId, initialVariables }: EnvironmentTabProps) {
  const [variables, setVariables] = useState<EnvVar[]>(initialVariables);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSecret, setIsSecret] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedValues, setRevealedValues] = useState<Record<string, string>>({});
  const [isRevealing, setIsRevealing] = useState<Record<string, boolean>>({});
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkContent, setBulkContent] = useState("");

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newKey.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/environment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: newKey.trim(),
          value: newValue,
          isSecret,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save variable");
        setIsSubmitting(false);
        return;
      }

      setVariables((prev) => {
        const filtered = prev.filter((v) => v.key !== newKey.toUpperCase().trim());
        return [
          ...filtered,
          {
            id: data.variable.id,
            key: data.variable.key,
            value: isSecret ? "••••••••••••" : newValue,
            isSecret,
            createdAt: new Date(),
          },
        ].sort((a, b) => a.key.localeCompare(b.key));
      });

      setNewKey("");
      setNewValue("");
      setIsSubmitting(false);
    } catch {
      setError("Network error saving variable");
      setIsSubmitting(false);
    }
  };

  const handleReveal = async (key: string) => {
    if (revealedValues[key]) {
      // Toggle off
      const next = { ...revealedValues };
      delete next[key];
      setRevealedValues(next);
      return;
    }

    setIsRevealing((prev) => ({ ...prev, [key]: true }));
    try {
      const res = await fetch(`/api/projects/${projectId}/environment?reveal=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (res.ok && data.variables) {
        const item = data.variables.find((v: EnvVar) => v.key === key);
        if (item) {
          setRevealedValues((prev) => ({ ...prev, [key]: item.value }));
        }
      }
    } finally {
      setIsRevealing((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDelete = async (varId: string, key: string) => {
    if (!confirm(`Are you sure you want to delete variable ${key}?`)) return;

    try {
      const res = await fetch(`/api/projects/${projectId}/environment?varId=${varId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setVariables((prev) => prev.filter((v) => v.id !== varId));
        const nextRevealed = { ...revealedValues };
        delete nextRevealed[key];
        setRevealedValues(nextRevealed);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const lines = bulkContent.split("\n");
    const parsedVars: { key: string; value: string; isSecret: boolean }[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const k = trimmed.substring(0, eqIdx).trim();
      let v = trimmed.substring(eqIdx + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1);
      }
      if (k) {
        parsedVars.push({ key: k, value: v, isSecret: true });
      }
    }

    if (parsedVars.length === 0) {
      setError("No valid KEY=VALUE pairs found");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`/api/projects/${projectId}/environment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables: parsedVars }),
      });

      if (res.ok) {
        // Refresh variables
        const listRes = await fetch(`/api/projects/${projectId}/environment`);
        const listData = await listRes.json();
        if (listData.variables) {
          setVariables(listData.variables);
        }
        setIsBulkOpen(false);
        setBulkContent("");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to bulk import");
      }
    } catch {
      setError("Network error during bulk import");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-white">Environment Variables</h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Encrypted with AES-256-GCM and injected into your container at runtime
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsBulkOpen(!isBulkOpen)}
        >
          <FileText className="h-3.5 w-3.5 mr-1.5" />
          {isBulkOpen ? "Hide Bulk Import" : "Bulk Import .env"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Bulk Import Box */}
      {isBulkOpen && (
        <Card className="border-zinc-700 bg-zinc-950/80">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold">Bulk .env Import</CardTitle>
            <CardDescription className="text-[11px]">
              Paste your .env file contents below (KEY=VALUE per line)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <textarea
              rows={5}
              placeholder="DATABASE_URL=postgres://...\nJWT_SECRET=supersecret\nPORT=3000"
              value={bulkContent}
              onChange={(e) => setBulkContent(e.target.value)}
              className="w-full rounded-md border border-zinc-800 bg-zinc-900/90 p-3 font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-400"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleBulkSubmit}
                disabled={isSubmitting || !bulkContent.trim()}
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <KeyRound className="h-3.5 w-3.5 mr-1" />
                )}
                Import & Encrypt
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Single Variable Form */}
      <Card>
        <CardContent className="p-4">
          <form onSubmit={handleAdd} className="flex flex-col sm:flex-row items-end gap-3 text-xs">
            <div className="w-full sm:w-1/3 space-y-1">
              <label className="font-medium text-zinc-300">Key</label>
              <Input
                placeholder="DATABASE_URL"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                required
                className="font-mono uppercase text-xs"
              />
            </div>
            <div className="w-full sm:w-1/2 space-y-1">
              <label className="font-medium text-zinc-300">Value</label>
              <Input
                type="text"
                placeholder="Secret value..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
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
                  Save
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Variables List */}
      <Card className="divide-y divide-zinc-800/80 overflow-hidden">
        {variables.length === 0 ? (
          <div className="p-8 text-center text-xs text-zinc-500 font-mono">
            No environment variables configured.
          </div>
        ) : (
          variables.map((v) => {
            const isShown = Boolean(revealedValues[v.key]);
            const displayVal = isShown ? revealedValues[v.key] : v.value;

            return (
              <div
                key={v.id}
                className="flex items-center justify-between p-3 px-4 text-xs hover:bg-zinc-900/40 transition-colors"
              >
                <div className="flex items-center gap-2 font-mono">
                  <Lock className="h-3.5 w-3.5 text-zinc-400" />
                  <span className="font-semibold text-zinc-200">{v.key}</span>
                  <span className="text-zinc-600">=</span>
                  <span className="text-zinc-400 select-all font-mono truncate max-w-xs sm:max-w-md">
                    {displayVal}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleReveal(v.key)}
                    disabled={isRevealing[v.key]}
                    className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                    title={isShown ? "Hide Value" : "Reveal Value"}
                  >
                    {isRevealing[v.key] ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : isShown ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(v.id, v.key)}
                    className="p-1.5 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                    title="Delete Variable"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </Card>
    </div>
  );
}
