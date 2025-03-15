"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Shield, Users, FileText, Book, ExternalLink } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function AdminSidebar() {
  const pathname = usePathname();

  const routes = [
    {
      href: "/admin/moderation",
      icon: Shield,
      label: "Moderation",
    },
    {
      href: "/admin/players",
      icon: Users,
      label: "Players",
    },
    {
      href: "/admin/rules",
      icon: Book,
      label: "Rules",
    },
  ];

  const externalLinks = [
    {
      href: "/moderation-log",
      icon: ExternalLink,
      label: "Public Mod Log",
    },
  ];

  return (
    <div className="h-full p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Admin Panel</h2>
      </div>

      <nav className="space-y-1">
        {routes.map((route) => (
          <Link
            key={route.href}
            href={route.href}
            className={cn(
              "flex items-center gap-3 rounded px-3 py-2 text-sm",
              pathname === route.href
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-700 hover:text-white"
            )}
          >
            <route.icon className="w-4 h-4" />
            {route.label}
          </Link>
        ))}
      </nav>

      <Separator className="my-4 bg-slate-700" />

      <div className="mb-2">
        <h3 className="px-2 text-sm text-slate-400">External Links</h3>
      </div>

      <nav className="space-y-1">
        {externalLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
          >
            <link.icon className="w-4 h-4" />
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
