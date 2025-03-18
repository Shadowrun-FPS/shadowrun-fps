"use client";

import React from "react";
import { useParams } from "next/navigation";
import { PlayerRatingCard } from "@/components/player-rating-card";

export default function PlayerProfile({ params }: { params: { id: string } }) {
  // For now, return a simple placeholder until the full implementation is ready
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">Player Profile</h1>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* These are placeholders that you'll replace with real data */}
        <PlayerRatingCard
          title="1v1"
          rating={800}
          wins={0}
          losses={0}
          tier="Bronze"
          progress={0}
        />
        <PlayerRatingCard
          title="2v2"
          rating={800}
          wins={0}
          losses={0}
          tier="Bronze"
          progress={0}
        />
        <PlayerRatingCard
          title="4v4"
          rating={800}
          wins={0}
          losses={0}
          tier="Bronze"
          progress={0}
        />
        <PlayerRatingCard
          title="5v5"
          rating={800}
          wins={0}
          losses={0}
          tier="Bronze"
          progress={0}
        />
      </div>
    </div>
  );
}
