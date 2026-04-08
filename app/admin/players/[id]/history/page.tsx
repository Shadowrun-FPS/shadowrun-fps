"use client";

import { Suspense, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { PlayerHistory } from "@/components/player-history";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { parseSafeInternalReturnTo } from "@/lib/safe-return-to";

function PlayerHistoryPageInner() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const playerId = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : "";

  const returnTo = parseSafeInternalReturnTo(searchParams.get("returnTo"));

  const handleBack = useCallback(() => {
    if (returnTo) {
      router.push(returnTo);
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/admin/players");
  }, [returnTo, router]);

  return (
    <div className="container mx-auto space-y-6 px-4 py-6 sm:px-6">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={handleBack}
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        Back
      </Button>

      <PlayerHistory playerId={playerId} />
    </div>
  );
}

export default function PlayerHistoryPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-6 sm:px-6">
          <div className="py-8 text-center text-muted-foreground">
            Loading…
          </div>
        </div>
      }
    >
      <PlayerHistoryPageInner />
    </Suspense>
  );
}
