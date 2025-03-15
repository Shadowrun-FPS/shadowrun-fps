"use client";

import { useParams } from "next/navigation";
import { PlayerHistory } from "@/components/player-history";
import PublicModerationLog from "@/components/public-moderation-log";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function PlayerHistoryPage() {
  const params = useParams();
  const playerId = params?.id
    ? Array.isArray(params.id)
      ? params.id[0]
      : params.id
    : "";

  return (
    <div className="container py-6 mx-auto space-y-6">
      <Button variant="outline" size="sm" asChild className="mb-6">
        <Link href="/admin/players" className="flex items-center">
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back to Players
        </Link>
      </Button>

      <Suspense fallback={<div>Loading player history...</div>}>
        <PlayerHistory playerId={playerId} />
      </Suspense>
    </div>
  );
}
