"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderGit2,
  Rocket,
  Globe,
  Activity,
  Settings,
  Server,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Projects",
    href: "/projects",
    icon: FolderGit2,
  },
  {
    title: "Deployments",
    href: "/deployments",
    icon: Rocket,
  },
  {
    title: "Domains",
    href: "/domains",
    icon: Globe,
  },
  {
    title: "Monitoring",
    href: "/monitoring",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-zinc-800/80 bg-[#0c0c0e] text-zinc-300">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-zinc-800/80 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-100 text-zinc-950 font-bold text-base shadow-xs">
          <Server className="h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-white">
            Toyamas Cloud
          </span>
          <span className="text-[10px] text-zinc-400 font-medium">
            Infrastructure PaaS
          </span>
        </div>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
          Platform
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-all",
                  isActive
                    ? "bg-zinc-800/90 text-white shadow-xs"
                    : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive ? "text-white" : "text-zinc-400 group-hover:text-zinc-300"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {isActive && (
                  <ChevronRight className="h-3.5 w-3.5 text-zinc-400 opacity-60" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Footer Badge */}
      <div className="border-t border-zinc-800/80 p-4">
        <div className="flex items-center justify-between rounded-md border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
            </span>
            <span className="text-zinc-300 font-mono text-[11px]">System Online</span>
          </div>
          <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
            v0.1.0
          </span>
        </div>
      </div>
    </aside>
  );
}
