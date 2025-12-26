"use client";

import { ReactNode, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin-sidebar";
import {
  SECURITY_CONFIG,
  hasAdminRole,
  hasModeratorRole,
} from "@/lib/security-config";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Handle authentication and authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      // Check if authenticated
      if (status === "unauthenticated") {
        router.push("/login");
        return;
      }

      // Check if user has admin rights - more permissive check
      if (status === "authenticated" && session?.user) {
        // Check developer ID with hardcoded fallback
        const DEVELOPER_DISCORD_ID = "238329746671271936";
        const isDeveloper =
          session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
          session.user.id === DEVELOPER_DISCORD_ID;

        let userRoles = session.user.roles || [];

        // Always try to fetch roles from API to ensure we have the latest
        try {
          const rolesResponse = await fetch("/api/discord/user-roles");
          if (rolesResponse.ok) {
            const rolesData = await rolesResponse.json();
            userRoles = rolesData.roles || [];
          }
        } catch (error) {
          // Silently handle errors
        }

        const userHasAdminRole = hasAdminRole(userRoles);
        const userHasModeratorRole = hasModeratorRole(userRoles);
        const isAdminUser = session.user.isAdmin;

        const isAuthorized =
          isDeveloper ||
          isAdminUser ||
          userHasAdminRole ||
          userHasModeratorRole;

        if (!isAuthorized) {
          router.push("/");
          return;
        }
      }

      setIsMounted(true);
    };

    checkAuthorization();
  }, [status, session, router]);

  // Don't render anything until authentication check is complete
  if (!isMounted || status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Fixed sidebar - shows on extra large screens only (xl:), mobile menu used up to xl: */}
      <aside className="hidden xl:block fixed left-0 top-[104px] bottom-0 w-72 overflow-y-auto z-30 border-r border-border/40 bg-muted/20 backdrop-blur-sm">
        <AdminSidebar />
      </aside>

      {/* Main content - offset to account for fixed sidebar */}
      <main className="min-h-screen xl:ml-72">
        <div className="max-w-[1600px] mx-auto">{children}</div>
      </main>
    </div>
  );
}
