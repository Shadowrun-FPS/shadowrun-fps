"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, Users, FileText, Book, Eye } from "lucide-react";

export function AdminSidebar() {
  const pathname = usePathname();

  const routes = [
    {
      href: "/admin/players",
      icon: Users,
      label: "Players",
    },
    {
      href: "/admin/moderation",
      icon: Shield,
      label: "Moderation",
    },
    {
      href: "/admin/logs",
      icon: FileText,
      label: "Logs",
    },
    {
      href: "/admin/rules",
      icon: Book,
      label: "Rules",
    },
    {
      href: "/moderation-log",
      icon: Eye,
      label: "Public Log",
    },
  ];

  return (
    <div className="hidden lg:flex flex-col fixed left-0 top-0 w-64 h-full bg-gradient-to-b from-slate-900 to-slate-800 p-4 text-white">
      <div className="font-bold text-xl mb-8 px-4 pt-4 flex items-center gap-2">
        <Shield className="h-6 w-6 text-indigo-400" />
        <span>Mod Panel</span>
      </div>
      <nav className="space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
              pathname === route.href
                ? "bg-indigo-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}
          >
            <route.icon className="h-4 w-4" />
            {route.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
