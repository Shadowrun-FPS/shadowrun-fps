"use client";

import { useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export function PlayerUpdater() {
  const { data: session, status } = useSession();
  const lastUpdateRef = useRef<number>(0);
  const hasUpdatedThisSessionRef = useRef<boolean>(false);

  useEffect(() => {
    // Only run when user is authenticated
    if (status === "authenticated" && session?.user) {
      const now = Date.now();

      // Update if it's the first time in this session OR if it's been more than 5 minutes
      if (
        !hasUpdatedThisSessionRef.current ||
        now - lastUpdateRef.current > 300000
      ) {
        lastUpdateRef.current = now;
        hasUpdatedThisSessionRef.current = true;

        // Simple fetch to our API route
        fetch("/api/players/update", {
          method: "POST",
        }).catch((error) => {
          console.error("Failed to update player:", error);
        });
      }
    }
  }, [session, status]);

  // This component doesn't render anything
  return null;
}
