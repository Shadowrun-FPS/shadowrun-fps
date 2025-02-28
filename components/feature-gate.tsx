"use client";

import { isFeatureEnabled } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface FeatureGateProps {
  feature: "queues" | "tournaments" | "rankings" | "teams" | "scrimmage";
  children: React.ReactNode;
}

export function FeatureGate({ feature, children }: FeatureGateProps) {
  const router = useRouter();

  useEffect(() => {
    if (!isFeatureEnabled(feature)) {
      router.push("/");
    }
  }, [feature, router]);

  if (!isFeatureEnabled(feature)) {
    return null;
  }

  return <>{children}</>;
}
