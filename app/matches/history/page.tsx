import { getMatches } from "@/lib/match-helpers";
import MatchHistory from "./match-history";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Ranked Match History",
  openGraph: {
    title: "Ranked Match History",
  },
};

export default async function MatchHistoryPage() {
  return (
    <div className="">
      <MatchHistory />
    </div>
  );
}
