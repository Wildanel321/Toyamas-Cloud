"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, LogOut, Shield, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UserMenuProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/auth/logout", {
        method: "POST",
      });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-left text-sm text-zinc-200 transition-colors hover:bg-zinc-800 hover:text-white"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-xs font-semibold text-zinc-300 border border-zinc-700">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="hidden sm:flex flex-col text-left leading-tight">
          <span className="text-xs font-medium text-zinc-200">{user.name}</span>
          <span className="text-[10px] text-zinc-400">{user.email}</span>
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-zinc-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-md border border-zinc-800 bg-zinc-900 p-1.5 shadow-lg backdrop-blur-md">
            <div className="px-3 py-2 border-b border-zinc-800/80">
              <p className="text-xs font-medium text-white">{user.name}</p>
              <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <Shield className="h-3 w-3 text-zinc-400" />
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-300 font-semibold">
                  {user.role}
                </span>
              </div>
            </div>

            <div className="pt-1">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <LogOut className="h-3.5 w-3.5" />
                )}
                <span>{isLoggingOut ? "Signing out..." : "Sign out"}</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
