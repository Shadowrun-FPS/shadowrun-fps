import { Metadata } from "next";
import { getMatch } from "@/lib/match-helpers";
import { unstable_cache } from "next/cache";
import { ReadyContent } from "./ready-content";

export const metadata: Metadata = {
  title: "Match Ready Check!",
};

export default async function ReadyCheckPage({
  params,
}: {
  params: { matchId: string };
}) {
  const matchId = params.matchId;
  // console.log("render ready check page", matchId, match);
  return (
    <div className="container grid gap-4">
      <h1 className="text-5xl font-bold">Ready Check</h1>
      <ReadyContent matchId={matchId} />
    </div>
  );
}
