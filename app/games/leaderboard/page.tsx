import "@/app/globals.css";
import "./leaderboardStyles.css";
import Pagination from "./pagination";
import formatPlayerStats from "./leaderboardBody";
import LeaderboardCategory from "./leaderboardCategory";
import TeamSizeMenu from "./teamSizeSelection";
import { BASE_URL } from "@/lib/baseurl";
import {
  teamSizeDefault,
  rowsDefault,
  sortOptionDefault,
  dirOptionDefault,
} from "./common";

import React from "react";

const leaderboard_categories = [
  // [Category, Query Abbreviation, Tailwind class names specific to that category]
  ["ELO", "e", ""],
  ["W", "w", ""],
  ["L", "l", ""],
  ["W/L Ratio", "r", ""],
];

const getStats = async (searchParams: {
  page: number;
  sort: string;
  dir: string;
  rows: number;
  teamSize: string;
}) => {
  const sortOption = searchParams?.sort;
  const dirOption = searchParams?.dir;
  const page = searchParams?.page;
  const rows = searchParams?.rows;
  const teamSizeOption = searchParams?.teamSize;
  try {
    console.log(
      "FETCHING PLAYERS FROM: " +
        BASE_URL +
        "/api/players/?page=" +
        String(page) +
        "&sort=" +
        sortOption +
        "&dir=" +
        dirOption +
        "&teamSize=" +
        teamSizeOption +
        "&rows=" +
        rows
    );
    const res = await fetch(
      BASE_URL +
        "/api/players/?page=" +
        String(page) +
        "&sort=" +
        sortOption +
        "&dir=" +
        dirOption +
        "&teamSize=" +
        teamSizeOption +
        "&rows=" +
        rows,
      {
        cache: "no-store",
      }
    );
    console.log("Done fetching.... allegedly");
    if (!res.ok) {
      console.log("Fetch stats error response:", res);
      throw new Error("Failed to fetch stats");
    }
    return res.json();
  } catch (error) {
    console.log("Error loading stats", error);
  }
};

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
  console.log("MONBODG_UIR", process.env.MONGODB_URI)
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
  const playerStatsFetch = (await getStats({
    page: page,
    sort: sortOption,
    dir: dirOption,
    rows: rowsPerPage,
    teamSize: teamSizeOption,
  })) || { players: [] };
  const playerStatsQuery = playerStatsFetch.players;
  const playerCount = playerStatsFetch.playerCount;
  const startingRankNumber = descending
    ? (page - 1) * rowsPerPage
    : playerCount - (page - 1) * rowsPerPage;
  const leaderboardBody = formatPlayerStats(
    playerStatsQuery,
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
              <th scope="col" className="px-6 py-3" key="Player ID">
                Player ID
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
