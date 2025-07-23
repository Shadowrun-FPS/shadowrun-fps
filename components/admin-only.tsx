"use client";

import { SECURITY_CONFIG } from "@/lib/security-config";
import { useSession } from "next-auth/react";
import { ReactNode } from "react";

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const { data: session } = useSession();

  const isAdmin =
    session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
    (session?.user?.roles && session.user.roles.includes("admin"));

  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export function ModeratorOnly({ children, fallback = null }: AdminOnlyProps) {
  const { data: session } = useSession();

  const isModerator =
    session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
    (session?.user?.roles &&
      (session.user.roles.includes("admin") ||
        session.user.roles.includes("moderator")));

  if (!isModerator) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
