"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Server,
  Shield,
  User,
  Mail,
  Lock,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function checkSetupRequirement() {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (!data.needsSetup) {
          // Setup is already done, redirect to login or dashboard
          router.push("/login");
        } else {
          setIsVerifying(false);
        }
      } catch {
        setIsVerifying(false);
      }
    }
    checkSetupRequirement();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to complete setup");
        setIsLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("A network error occurred during setup. Please try again.");
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090b]">
        <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 py-12">
      {/* Brand logo & title */}
      <div className="mb-8 flex flex-col items-center text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-950 shadow-md mb-3">
          <Server className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Toyamas Cloud Setup
        </h1>
        <p className="text-xs text-zinc-400 mt-1 font-mono">
          Initialize your self-hosted platform administrator
        </p>
      </div>

      {/* Setup Card */}
      <div className="w-full max-w-md rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-6 shadow-2xl backdrop-blur-md">
        <div className="mb-6 border-b border-zinc-800/80 pb-4">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
            <Shield className="h-4 w-4 text-emerald-400" />
            <span>Administrator Account</span>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            This account will have full access to deploy applications, manage containers, and configure reverse proxies.
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
              <User className="h-3.5 w-3.5 text-zinc-400" />
              Full Name
            </label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Administrator"
              required
              disabled={isLoading}
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-zinc-400" />
              Email Address
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@wildanstore.my.id"
              required
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
              minLength={8}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-zinc-400" />
              Confirm Password
            </label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              minLength={8}
              disabled={isLoading}
            />
          </div>

          <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-3 text-[11px] text-zinc-400 space-y-1.5">
            <div className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              System Initialization Details
            </div>
            <p>• Role: <span className="font-mono text-zinc-300">ADMIN</span></p>
            <p>• Password encryption: <span className="font-mono text-zinc-300">bcrypt (12 rounds)</span></p>
            <p>• Base Domain: <span className="font-mono text-zinc-300">wildanstore.my.id</span></p>
          </div>

          <Button
            type="submit"
            className="w-full mt-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Initializing System...
              </>
            ) : (
              <>
                Complete Setup & Enter Dashboard
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
