"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";

export function PlayerUpdater() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Only run when user is authenticated
    if (status === "authenticated" && session?.user) {
      // Simple fetch to our API route
      fetch("/api/players/update", {
        method: "POST",
      }).catch((error) => {
        console.error("Failed to update player:", error);
      });
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
}
