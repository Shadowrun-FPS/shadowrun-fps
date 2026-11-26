"use client";

import { useState } from "react";

import { RivalryDetail } from "@/components/rivals/rivalry-detail";
import type { LeaderboardPayload } from "@/types";

export default function RivalryClient({
  initialData,
  pairKey,
  playerIds,
  initialPlayerId,
}: {
  initialData: LeaderboardPayload | null;
  pairKey: string;
  playerIds: [string, string];
  initialPlayerId: string | null;
}) {
  const [data] = useState(initialData);

  if (!data) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-sm text-muted-foreground">
        This rivalry is temporarily unavailable. Try again in a minute.
      </div>
    );
  }

  return (
    <RivalryDetail
      data={data}
      pairKey={pairKey}
      playerIds={playerIds}
      initialPlayerId={initialPlayerId}
    />
  );
}
