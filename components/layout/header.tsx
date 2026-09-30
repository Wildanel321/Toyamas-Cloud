"use client";

import { usePathname } from "next/navigation";
import { UserMenu } from "./user-menu";
import { Server, Globe } from "lucide-react";

interface HeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "USER";
  };
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "System Overview",
  "/projects": "Projects",
  "/deployments": "Deployments",
  "/domains": "Domain Management",
  "/monitoring": "System Metrics",
  "/settings": "Platform Settings",
};

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const pageTitle = PAGE_TITLES[pathname] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800/80 bg-[#09090b]/80 px-8 backdrop-blur-md">
      {/* Title & Path */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-semibold tracking-tight text-white">
          {pageTitle}
        </h1>
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-2.5 py-0.5 text-[11px] font-mono text-zinc-400">
          <Globe className="h-3 w-3 text-zinc-400" />
          <span>wildanstore.my.id</span>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
