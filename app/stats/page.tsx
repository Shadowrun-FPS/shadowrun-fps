"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Create a client component that uses hooks
const RedirectContent = () => {
  // Import hooks inside the client component
  const { useRouter, useSearchParams } = require("next/navigation");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use React's useEffect
  const { useEffect } = require("react");

  useEffect(() => {
    // Get all the search params
    const params = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      params.append(key, value);
    }

    // Redirect to new path while preserving all query parameters
    router.replace(`/player/stats?${params.toString()}`);
  }, [router, searchParams]);

  return <div className="container py-6">Redirecting...</div>;
};

// Main page component that doesn't use any client hooks directly
export default function StatsPage() {
  return (
    <Suspense
      fallback={
        <div className="container py-6 mx-auto">
          <div className="space-y-4">
            <Skeleton className="w-1/3 h-12" />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </div>
      }
    >
      <RedirectContent />
    </Suspense>
  );
}
