import "@/app/globals.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import "./leaderboardStyles.css";
import Pagination from "./pagination";
import formatPlayerStats from "./leaderboardBody";
import LeaderboardCategory from "./leaderboardCategory";


import React from "react";
const leaderboard_url = process.env.NEXT_PUBLIC_API_URL + "/leaderboard";

const leaderboard_categories = [
  // [Category, Query Abbreviation, Tailwind class names specific to that category]
  ['Player ID', 'e', ''],
  ['ELO'      , 'e', ''],
  ['W'        , 'w', ''],
  ['L'        , 'l', ''],
  ['W/L Ratio', 'r', ''],
]

const getStats = async (searchParams: {
  page: number;
  sort: string;
  dir: string;
}) => {
  const sortOption = searchParams?.sort;
  const dirOption = searchParams?.dir;
  const page = searchParams?.page;
  try {
    const res = await fetch(
      process.env.NEXT_PUBLIC_API_URL +
        "/api/players/" +
        `${page}` +
        getSearchParamsString({ sort: sortOption, dir: dirOption }),
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch stats");
    }
    return res.json();
  } catch (error) {
    console.log("Error loading stats");
  }
};

export default async function Leaderboard({
  searchParams,
}: {
  searchParams: { page: number; sort: string; dir: string };
}) {
  const page = Math.max(searchParams.page || 1, 1);
  const sortOption = searchParams?.sort ? searchParams.sort : "e";
  const dirOption = searchParams?.dir ? searchParams.dir : "desc";
  const descending = dirOption == "desc" ? true : false;
  const playersPerPage = 20; // If changing, change the same var value in the api/players/[lbpage]/route.ts file
  const playerStatsFetch = await getStats({
    page: page,
    sort: sortOption,
    dir: dirOption,
  });
  const playerStatsQuery = playerStatsFetch.players;
  const playerCount = playerStatsFetch.playerCount;
  const startingRankNumber = descending ? (page - 1) * playersPerPage : playerCount - ((page - 1) * playersPerPage);
  const leaderboardBody = formatPlayerStats(playerStatsQuery, startingRankNumber, descending)
  return (
    <>
      <h1 className="flex justify-center text-3xl font-bold">Leaderboard</h1>
      <br />
      <div className="md:mx-[10%] md:h-[70vh] h-[60vh] overflow-y-auto shadow-md sm:rounded-lg">
        <table className="w-full text-sm text-left text-gray-500 rtl:text-right dark:text-gray-400">
          <thead className="text-xs text-gray-700 bg-gray-300 dark:bg-slate-700 dark:text-gray-400">
              <tr>
                  <th scope="col" className="px-6 py-3">
                    Player ID
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <LeaderboardCategory category="ELO" sortingAbbreviation="e" twClasses="" />
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <LeaderboardCategory category="W" sortingAbbreviation="w" twClasses="" />
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <LeaderboardCategory category="L" sortingAbbreviation="l" twClasses="" />
                  </th>
                  <th scope="col" className="px-6 py-3">
                    <LeaderboardCategory category="W/L Ratio" sortingAbbreviation="r" twClasses="" />
                  </th>
              </tr>
          </thead>
          <tbody>

          </tbody>
          {leaderboardBody}
        </table>
      </div>
      <Pagination
        page={page}
        playerCount={playerCount}
        playersPerPage={playersPerPage}
      />
    </>
  );
}


const getSearchParamsString = (sortOptions: { sort: string; dir: string }) => {
  const searchOption = sortOptions?.sort;
  const dirOption = sortOptions?.dir;
  if (!searchOption && !dirOption) {
    return "";
  }
  var urlQueryAddOn = "?";
  if (searchOption) {
    urlQueryAddOn = urlQueryAddOn + "sort=" + searchOption;
  }
  if (dirOption) {
    if (urlQueryAddOn[urlQueryAddOn.length - 1] != "?") {
      urlQueryAddOn = urlQueryAddOn + "&";
    }
    urlQueryAddOn = urlQueryAddOn + "dir=" + dirOption;
  }

  return urlQueryAddOn;
};