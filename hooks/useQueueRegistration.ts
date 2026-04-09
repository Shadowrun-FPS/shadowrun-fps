"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { safeLog } from "@/lib/security";
import {
  registrationErrorToast,
  queueApiNetworkErrorToast,
} from "@/lib/queue-page-toast-messages";
import type { Session } from "next-auth";

interface UseQueueRegistrationResult {
  isRegistered: boolean;
  isCheckingRegistration: boolean;
  missingTeamSizes: number[];
  isRegistering: boolean;
  isRegisteringMissing: boolean;
  handleRegisterForRanked: () => Promise<void>;
  handleRegisterMissingTeamSizes: () => Promise<void>;
}

export function useQueueRegistration(
  session: Session | null,
): UseQueueRegistrationResult {
  const { toast } = useToast();
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(false);
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(true);
  const [missingTeamSizes, setMissingTeamSizes] = useState<number[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegisteringMissing, setIsRegisteringMissing] = useState(false);

  const checkRegistration = useCallback(async () => {
    if (!session?.user || document.hidden) return;
    setIsCheckingRegistration(true);
    try {
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const [regData, sizeData] = await Promise.all([
        deduplicatedFetch<{ isRegistered: boolean }>(
          "/api/players/check-registration",
          { ttl: 30000 },
        ).catch(() => ({ isRegistered: false })),
        deduplicatedFetch<{ missingTeamSizes: number[] }>(
          "/api/players/check-missing-teamsizes",
          { ttl: 30000 },
        ).catch(() => ({ missingTeamSizes: [] })),
      ]);
      setIsRegistered(regData.isRegistered);
      setMissingTeamSizes(sizeData.missingTeamSizes ?? []);
    } catch (error) {
      safeLog.error("Failed to check registration/team sizes:", error);
    } finally {
      setIsCheckingRegistration(false);
    }
  }, [session?.user]);

  useEffect(() => {
    if (session?.user && !document.hidden) void checkRegistration();
  }, [session?.user?.id, checkRegistration]);

  const handleRegisterForRanked = useCallback(async () => {
    if (!session?.user) return;
    setIsRegistering(true);
    try {
      const response = await fetch("/api/players/register", { method: "POST" });
      let data: { error?: string } = {};
      try { data = await response.json(); } catch { /* non-JSON */ }
      if (!response.ok) {
        const { title, description } = registrationErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({ title, description, variant: "destructive", duration: 4000 });
        return;
      }
      setIsRegistered(true);
      toast({
        title: "You're registered",
        description: "You can join ranked queues for modes you've signed up for.",
        duration: 3000,
      });
      void checkRegistration();
    } catch (error) {
      safeLog.error("Register for ranked:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({ title, description, variant: "destructive", duration: 4000 });
    } finally {
      setIsRegistering(false);
    }
  }, [session?.user, toast, checkRegistration]);

  const handleRegisterMissingTeamSizes = useCallback(async () => {
    if (!session?.user) return;
    setIsRegisteringMissing(true);
    try {
      const response = await fetch("/api/players/register-missing-teamsizes", {
        method: "POST",
      });
      let data: { error?: string; registeredSizes?: number[]; message?: string } = {};
      try { data = await response.json(); } catch { /* non-JSON */ }
      if (!response.ok) {
        const { title, description } = registrationErrorToast(
          response.status,
          typeof data.error === "string" ? data.error : undefined,
        );
        toast({ title, description, variant: "destructive", duration: 4000 });
        return;
      }
      setMissingTeamSizes([]);
      router.refresh();
      const sizes = data.registeredSizes ?? [];
      toast({
        title: "Registration successful",
        description:
          sizes.length > 0
            ? `You've been registered for ${sizes.map((s) => `${s}v${s}`).join(", ")} queues`
            : (typeof data.message === "string" ? data.message : "You're set for the available queue sizes."),
        duration: 3000,
      });
    } catch (error) {
      safeLog.error("Register missing team sizes:", error);
      const { title, description } = queueApiNetworkErrorToast();
      toast({ title, description, variant: "destructive", duration: 4000 });
    } finally {
      setIsRegisteringMissing(false);
    }
  }, [session?.user, toast, router]);

  return {
    isRegistered,
    isCheckingRegistration,
    missingTeamSizes,
    isRegistering,
    isRegisteringMissing,
    handleRegisterForRanked,
    handleRegisterMissingTeamSizes,
  };
}
