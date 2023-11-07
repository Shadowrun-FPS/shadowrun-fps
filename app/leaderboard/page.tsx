import "@/app/globals.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import "./leaderboardStyles.css";
import Pagination from "./pagination";

import React from "react";
const leaderboard_url = process.env.NEXT_PUBLIC_API_URL + "/leaderboard";

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

const getDiscordNicknames = async (playerStatsQuery: string) => {
  try {
    const fake = 3;
  } catch (error) {
    console.log("Error retrieiving Discord usernames");
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
  const playersPerPage = 20; // If changing, change the same var value in the api/players/[lbpage]/route.ts file
  const playerStatsFetch = await getStats({
    page: page,
    sort: sortOption,
    dir: dirOption,
  });
  const playerStatsQuery = playerStatsFetch.players;
  const playerCount = playerStatsFetch.playerCount;
  return (
    <>
      <h1 className="flex justify-center text-3xl font-bold">Leaderboard</h1>
      <br />
      <div className="flex flex-col items-center justify-center gap-4 columns-5xs">
        <div className="flex flex-wrap justify-center w-3/4 gap-4 font-bold rounded-md bg-slate-800">
          <div className="w-1/4 px-4 pl-24 leading-loose text-left">
            <Link
              href={{
                pathname: leaderboard_url + "/" + 1,
                query: { sort: "e", dir: "desc" },
              }}
            >
              Player ID
            </Link>
          </div>
          <div className="px-4 leading-loose text-center w-52">
            <Link
              href={{
                pathname: leaderboard_url + "/" + 1,
                query: {
                  sort: "e",
                  dir:
                    sortOption === "e" && dirOption === "desc" ? "asc" : "desc",
                },
              }}
              className={
                sortOption === "e"
                  ? dirOption === "desc"
                    ? "descending"
                    : "ascending"
                  : ""
              }
            >
              ELO
            </Link>
          </div>
          <div className="w-20 px-4 leading-loose text-center">
            <Link
              href={{
                pathname: leaderboard_url + "/" + 1,
                query: {
                  sort: "w",
                  dir:
                    sortOption === "w" && dirOption === "desc" ? "asc" : "desc",
                },
              }}
              className={
                sortOption === "w"
                  ? dirOption === "desc"
                    ? "descending"
                    : "ascending"
                  : ""
              }
            >
              W
            </Link>
          </div>
          <div className="w-20 px-4 leading-loose text-center">
            <Link
              href={{
                pathname: leaderboard_url + "/" + 1,
                query: {
                  sort: "l",
                  dir:
                    sortOption === "l" && dirOption === "desc" ? "asc" : "desc",
                },
              }}
              className={
                sortOption === "l"
                  ? dirOption === "desc"
                    ? "descending"
                    : "ascending"
                  : ""
              }
            >
              L
            </Link>
          </div>
          <div className="px-4 leading-loose text-center w-52">
            <Link
              href={{
                pathname: leaderboard_url + "/" + 1,
                query: {
                  sort: "r",
                  dir:
                    sortOption === "r" && dirOption === "desc" ? "asc" : "desc",
                },
              }}
              className={
                sortOption === "r"
                  ? dirOption === "desc"
                    ? "descending"
                    : "ascending"
                  : ""
              }
            >
              W/L Ratio
            </Link>
          </div>
        </div>
        {playerStatsQuery.map(
          (
            playerStats: {
              discordId: string;
              rating: number;
              wins: number;
              losses: number;
            },
            ranking: number
          ) => (
            <div className="flex flex-wrap justify-center w-3/4 gap-4">
              <div className="w-1/4 px-4 pl-8 leading-loose text-left">
                {ranking + 1 + (page - 1) * playersPerPage}.{" "}
                {playerStats.discordId}
              </div>
              <div className="flex items-start justify-center px-4 leading-loose align-middle w-52">
                {getRankIcon(playerStats.rating)} {playerStats.rating}
              </div>
              <div className="w-20 px-4 leading-loose text-center">
                {playerStats.wins}
              </div>
              <div className="w-20 px-4 leading-loose text-center">
                {playerStats.losses}
              </div>
              <div className="px-4 leading-loose text-center w-52">
                {(
                  playerStats.wins /
                  (playerStats.wins + playerStats.losses)
                ).toFixed(2)}
              </div>
            </div>
          )
        )}
        <Pagination
          page={page}
          playerCount={playerCount}
          playersPerPage={playersPerPage}
        />
      </div>
      <br />
    </>
  );
}
// TODO put this in a shared component called rank icon
const getRankIcon = (eloScore: number) => {
  var rankIconSrc: string = "/rankedicons/";
  var altTag: string;
  if (eloScore >= 1800) {
    rankIconSrc = rankIconSrc + "diamond_v002.png";
    altTag = "Diamond";
  } else if (eloScore >= 1500) {
    rankIconSrc = rankIconSrc + "platinum_v002.png";
    altTag = "Platinum";
  } else if (eloScore >= 1300) {
    rankIconSrc = rankIconSrc + "03_gold.png";
    altTag = "Gold";
  } else if (eloScore >= 1100) {
    rankIconSrc = rankIconSrc + "02_silver.png";
    altTag = "Silver";
  } else {
    rankIconSrc = rankIconSrc + "01_bronze.png";
    altTag = "Bronze";
  }
  return <Image src={rankIconSrc} alt={altTag} width="24" height="0" />;
};

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

const getSortLinkText = (
  sortText: string,
  sortOptions: { sort: string; dir: string }
) => {};
