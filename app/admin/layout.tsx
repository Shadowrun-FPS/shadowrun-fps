"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Shield,
  Users,
  Scroll,
  Menu,
  X,
  BookOpen,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DirectModerationDialogs } from "@/components/direct-moderation-dialogs";
import { AdminSidebar } from "@/components/admin-sidebar";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Handle authentication and authorization
  useEffect(() => {
    // Check if authenticated
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Check if user has admin rights - more permissive check
    if (status === "authenticated" && session?.user) {
      const isAdmin =
        session.user.id === "238329746671271936" || // Hardcoded admin ID
        (session.user.roles &&
          (session.user.roles.includes("admin") ||
            session.user.roles.includes("moderator") ||
            session.user.roles.includes("founder")));

      if (!isAdmin) {
        router.push("/");
        return;
      }
    }

    setIsMounted(true);
  }, [status, session, router]);

  // Don't render anything until authentication check is complete
  if (!isMounted || status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <>
      {/* Add a meta robots tag to ensure no indexing */}
      <head>
        <meta name="robots" content="noindex, nofollow" />
      </head>

      <div className="min-h-screen bg-background">
        {/* Mobile sidebar toggle */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <div className="w-10"></div>
        </div>

        {/* Mobile sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden">
            <div className="fixed inset-y-0 left-0 w-64 shadow-lg bg-background">
              <div className="flex items-center justify-between p-4">
                <h1 className="text-xl font-bold">Admin Panel</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>
              <AdminSidebar />
            </div>
          </div>
        )}

        <div className="flex">
          {/* Desktop sidebar */}
          <div className="hidden w-64 p-4 border-r md:block border-slate-800">
            <AdminSidebar />
          </div>

          {/* Main content */}
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </>
  );
}
