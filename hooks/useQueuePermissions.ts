"use client";

import { useCallback, useMemo } from "react";
import { SECURITY_CONFIG, isSessionAdminUser } from "@/lib/security-config";
import type { Session } from "next-auth";
import type { RuntimeQueue } from "@/types/admin-queue";

interface UseQueuePermissionsResult {
  isAdmin: boolean;
  isAdminOrMod: boolean;
  isDeveloperOrAdmin: boolean;
  canManageMaps: boolean;
  canManageQueueBans: boolean;
  canLaunchMatch: (queue: RuntimeQueue) => boolean;
}

export function useQueuePermissions(
  session: Session | null,
  userRoles: string[],
): UseQueuePermissionsResult {
  const effectiveRoles = useMemo(
    () => (userRoles.length > 0 ? userRoles : session?.user?.roles ?? []),
    [userRoles, session?.user?.roles],
  );

  const isDev = useMemo(
    () =>
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      session?.user?.id === "238329746671271936",
    [session?.user?.id],
  );

  const isAdmin = useMemo(() => {
    if (!session?.user) return false;
    return isSessionAdminUser(session.user, effectiveRoles);
  }, [session?.user, effectiveRoles]);

  const isAdminOrMod = useMemo(() => {
    if (!session?.user?.id) return false;
    return (
      isDev ||
      effectiveRoles.includes("admin") ||
      effectiveRoles.includes("moderator")
    );
  }, [isDev, effectiveRoles, session?.user?.id]);

  const isDeveloperOrAdmin = useMemo(
    () => isAdmin || isDev,
    [isAdmin, isDev],
  );

  const canManageMaps = useMemo(() => {
    if (!session?.user) return false;
    return Boolean(
      isDev ||
        isAdmin ||
        effectiveRoles.includes(SECURITY_CONFIG.ROLES.MODERATOR) ||
        effectiveRoles.includes(SECURITY_CONFIG.ROLES.ADMIN) ||
        effectiveRoles.includes(SECURITY_CONFIG.ROLES.FOUNDER) ||
        session.user.isAdmin,
    );
  }, [isDev, isAdmin, effectiveRoles, session?.user]);

  const canManageQueueBans = useMemo(() => {
    if (!session?.user) return false;
    return Boolean(
      isDev ||
        effectiveRoles.includes(SECURITY_CONFIG.ROLES.ADMIN) ||
        effectiveRoles.includes(SECURITY_CONFIG.ROLES.FOUNDER) ||
        session.user.isAdmin,
    );
  }, [isDev, effectiveRoles, session?.user]);

  const canLaunchMatch = useCallback(
    (queue: RuntimeQueue): boolean => {
      if (!session?.user?.id) return false;
      const hasRole =
        isDev ||
        effectiveRoles.includes(SECURITY_CONFIG.ROLES.GM) ||
        effectiveRoles.includes(SECURITY_CONFIG.ROLES.MODERATOR) ||
        effectiveRoles.includes(SECURITY_CONFIG.ROLES.ADMIN) ||
        effectiveRoles.includes(SECURITY_CONFIG.ROLES.FOUNDER) ||
        session.user.isAdmin;
      return Boolean(hasRole && queue.players.length >= queue.teamSize * 2);
    },
    [isDev, effectiveRoles, session?.user],
  );

  return {
    isAdmin,
    isAdminOrMod,
    isDeveloperOrAdmin,
    canManageMaps,
    canManageQueueBans,
    canLaunchMatch,
  };
}
