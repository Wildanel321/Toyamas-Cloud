"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Server, Lock, Mail, ArrowRight, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    // Check if initial setup is required
    async function checkStatus() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.needsSetup) {
          setNeedsSetup(true);
        } else if (data.user) {
          router.push("/dashboard");
        }
      } catch {
        // Ignore background health check error
      }
    }
    checkStatus();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Login failed. Please verify your credentials.");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4">
      {/* Brand logo & title */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 shadow-md mb-3">
          <Server className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Toyamas Cloud
        </h1>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          Simple deployment. Your infrastructure.
        </p>
      </div>

      {/* Setup notification banner if fresh installation */}
      {needsSetup && (
        <div className="mb-6 w-full max-w-sm rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-300">
          <div className="flex items-start gap-3">
            <ShieldCheck className="h-5 w-5 shrink-0 text-amber-400" />
            <div className="flex-1">
              <p className="font-medium text-amber-200">Fresh Installation Detected</p>
              <p className="mt-1 text-amber-300/80">
                No administrator account exists yet. Initialize your platform to get started.
              </p>
              <Link
                href="/setup"
                className="mt-2.5 inline-flex items-center gap-1 font-semibold text-white underline underline-offset-2 hover:text-amber-200"
              >
                Launch First-Time Setup <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Login Card */}
      <div className="w-full max-w-sm rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-zinc-100">Sign in to control plane</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Authenticate to manage applications and server resources
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@wildanstore.my.id"
              required
              autoComplete="email"
              autoFocus
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-zinc-400" />
              Password
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Authenticating...
              </>
            ) : (
              <>
                Sign in to Dashboard
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-zinc-400">
        <span>Toyamas Cloud PaaS • Host: </span>
        <span className="font-mono text-zinc-400">wildanstore.my.id</span>
      </div>
    </div>
  );
}
