"use client";

import { isFeatureEnabled } from "@/lib/features";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

interface FeatureGateProps {
  feature:
    | "queues"
    | "matches"
    | "tournaments"
    | "rankings"
    | "teams"
    | "scrimmage"
    | "leaderboard"
    | "playerStats";
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function FeatureGate({
  feature,
  children,
  requireAuth = false,
}: FeatureGateProps) {
  const router = useRouter();
  const { data: session } = useSession();

  const enabled = isFeatureEnabled(feature);

  useEffect(() => {
    if (!isFeatureEnabled(feature)) {
      window.location.href = "/";
    }
  }, [feature, router]);

  if (!enabled) {
    return null;
  }

  if (requireAuth && !session) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="mb-4">Please sign in to access this feature.</p>
        <Button onClick={() => signIn("discord")}>Sign In</Button>
      </div>
    );
  }

  return <>{children}</>;
}
