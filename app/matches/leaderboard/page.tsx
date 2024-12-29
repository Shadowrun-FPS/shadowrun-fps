import React from "react";
import Pagination from "./pagination";
import formatPlayerStats from "./leaderboardBody";
import LeaderboardCategory from "./leaderboardCategory";
import TeamSizeMenu from "./teamSizeSelection";
import {
  teamSizeDefault,
  rowsDefault,
  sortOptionDefault,
  dirOptionDefault,
} from "./common";
import { PlayerQuery } from "./serverPlayerQuery";
import { Metadata } from "next";

import "@/app/globals.css";
import "./leaderboardStyles.css";
import useFeatureFlag from "@/lib/hooks/useFeatureFlag";
import ComingSoon from "@/app/coming-soon";

export const metadata: Metadata = {
  title: "Leaderboard",
  openGraph: {
    title: "Leaderboard",
  },
};

const leaderboard_categories = [
  // [Category, Query Abbreviation, Tailwind class names specific to that category]
  ["ELO", "e", ""],
  ["W", "w", ""],
  ["L", "l", ""],
  ["W/L Ratio", "r", ""],
];

export default async function Leaderboard({
  searchParams,
}: {
  searchParams: {
    page: number;
    sort: string;
    dir: string;
    rows: string;
    teamSize: string;
  };
}) {
  const matchMakingFeatureFlag = useFeatureFlag("MATCHMAKING_ENABLED", false);
  if (!matchMakingFeatureFlag) {
    return (
      <ComingSoon
        title={"Ranked leaderboard"}
        description={
          "Check out the top ranked shadowrun fps players in our pick up game system. To be released with the matchmaking feature."
        }
      />
    );
  }

  const page = Math.max(searchParams.page || 1, 1);
  const sortOption = searchParams?.sort ? searchParams.sort : sortOptionDefault;
  const dirOption = searchParams?.dir ? searchParams.dir : dirOptionDefault;
  const descending = dirOption == "desc" ? true : false;
  const rowsPerPage = searchParams?.rows
    ? Number(searchParams.rows)
    : rowsDefault;
  const teamSizeOption = searchParams?.teamSize
    ? searchParams.teamSize
    : teamSizeDefault;
  const playerStatsQuery = await PlayerQuery({
    page: page,
    sort: sortOption,
    dir: dirOption,
    rows: rowsPerPage,
    teamSize: teamSizeOption,
  });
  const playerStats = playerStatsQuery.players;
  const playerCount = playerStatsQuery.playerCount;
  const startingRankNumber = descending
    ? (page - 1) * rowsPerPage
    : playerCount - (page - 1) * rowsPerPage;
  const leaderboardBody = formatPlayerStats(
    playerStats,
    startingRankNumber,
    descending
  );
  return (
    <>
      <h1 className="flex justify-center text-3xl font-bold">
        Leaderboard <TeamSizeMenu />
      </h1>
      <br />
      <div className="md:mx-[10%] md:h-[65vh] h-[55vh] overflow-y-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
          <thead className="sticky top-0 text-xs text-gray-700 bg-gray-300 dark:bg-slate-700 dark:text-gray-400">
            <tr key="header">
              <th scope="col" className="px-6 py-3" key="Discord Name">
                Discord Name
              </th>
              {leaderboard_categories.map((category) => (
                <th scope="col" className="px-6 py-3" key={category[0]}>
                  <LeaderboardCategory
                    category={category[0]}
                    sortingAbbreviation={category[1]}
                    defaultCategory={
                      leaderboard_categories[0][1] == category[1] ? true : false
                    }
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody></tbody>
          {leaderboardBody}
        </table>
      </div>
      <Pagination
        page={page}
        playerCount={playerCount}
        playersPerPage={rowsPerPage}
      />
    </>
  );
}
