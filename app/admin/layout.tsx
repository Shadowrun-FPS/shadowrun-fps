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
          isDeveloper || isAdminUser || userHasAdminRole || userHasModeratorRole;

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
        <div className="flex">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-72 border-r border-border/40 bg-muted/20 backdrop-blur-sm">
            <div className="sticky top-0 h-screen overflow-y-auto">
              <AdminSidebar />
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>
    </div>
  );
}
