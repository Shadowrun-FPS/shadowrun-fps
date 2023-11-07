import "@/app/globals.css";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import '../leaderboardStyles.css'

import React from "react";
const leaderboard_url = 'http://' + process.env.NEXT_PUBLIC_API_URL + "/leaderboard"

const getStats = async(lbpage: Number, searchParams: {sort: string, dir: string}) => {
    const sortOption = searchParams?.sort;
    const dirOption = searchParams?.dir;
    try {
        const res = await fetch(`http://` + process.env.NEXT_PUBLIC_API_URL + '/api/players/' + `${lbpage}` + getSearchParamsString({sort: sortOption, dir: dirOption}),
        {
            cache: 'no-store',
        });

        if (!res.ok) {
            throw new Error('Failed to fetch stats')
        }
        return res.json();
    } catch (error) {
        console.log('Error loading stats');
    }
}

const getDiscordNicknames = async(playerStatsQuery: string) => {
    try {
        const fake = 3;
    } catch (error) {
        console.log('Error retrieiving Discord usernames');
    }
}

function generatePageButtons(playerCount: number, playersPerLBPage: number, lbpage: number, sortOption: string, dirOption: string) {
    const rows = [];
    var skipButtons = false;
    for (var i = 0; (i * playersPerLBPage) < playerCount;  i += 1) {
        if (i > 0 && Math.abs((i+1) - lbpage) > 2 && ((i + 1) * playersPerLBPage < playerCount)) {
            console.log("Skipping", i);
            if (skipButtons) continue;
            rows.push(<Button size="sm" className="bg-slate-600">...</Button>)
            skipButtons = true;
            continue;
        }
        skipButtons = false;
        rows.push(
            <Link href={{pathname: leaderboard_url + "/" + (i + 1), query: {sort: sortOption, dir: dirOption}}}>
                <Button size="sm" className={i === lbpage - 1 ? "bg-slate-300": "bg-slate-600"}>{i + 1}</Button>
            </Link>
        );
    }
    if (skipButtons) {
        rows.push(
            <Link href={{pathname: leaderboard_url + "/" + (i + 1), query: {sort: sortOption, dir: dirOption}}}>
                <Button size="sm" className={i === lbpage - 1 ? "bg-slate-300": "bg-slate-600"}>{i + 1}</Button>
            </Link>
        );
    }
    return (
        <>
            <div className="flex justify-between w-1/3">
                {rows}
            </div>
        </>);
}


export default async function Leaderboard({params, searchParams } : {params: {lbpage: number}, searchParams: {sort: string, dir: string}}) {

    const lbpage = Math.max(params.lbpage || 1, 1);
    const sortOption = searchParams?.sort ? searchParams.sort : 'e';
    const dirOption = searchParams?.dir ? searchParams.dir : 'desc';
    const playersPerLBPage = 20; // If changing, change the same var value in the api/players/[lbpage]/route.ts file
    const playerStatsFetch = await getStats(lbpage, {sort: sortOption, dir: dirOption});
    const playerStatsQuery = playerStatsFetch.players;
    const playerCount = playerStatsFetch.playerCount;
    return (
        <>
            <h1 className="flex justify-center text-3xl font-bold">Leaderboard</h1>
            <br />
            <div className="flex flex-col items-center justify-center gap-4 columns-5xs">
                <div className="flex flex-wrap justify-center w-3/4 gap-4 font-bold rounded-md bg-slate-800">
                    <div className="w-1/4 px-4 pl-24 leading-loose text-left">
                        <Link href={{pathname: leaderboard_url + "/" + (1), query: {sort: "e", dir: "desc"}}}>
                            Player ID
                        </Link>
                    </div>
                    <div className="px-4 leading-loose text-center w-52">
                        <Link href={{pathname: leaderboard_url + "/" + (1), query: {sort: "e", dir: ((sortOption === 'e' && dirOption === "desc") ? "asc" : "desc")}}}
                        className={(sortOption === 'e'? ((dirOption === "desc") ? "descending" : "ascending") : "")}
                        >
                            ELO
                        </Link>
                    </div>
                    <div className="w-20 px-4 leading-loose text-center">
                        <Link href={{pathname: leaderboard_url + "/" + (1), query: {sort: "w", dir: ((sortOption === 'w' && dirOption === "desc") ? "asc" : "desc")}}}
                        className={(sortOption === 'w'? ((dirOption === "desc") ? "descending" : "ascending") : "")}
                        >
                            W
                        </Link>
                    </div>
                    <div className="w-20 px-4 leading-loose text-center">
                        <Link href={{pathname: leaderboard_url + "/" + (1), query: {sort: "l", dir: ((sortOption === 'l' && dirOption === "desc") ? "asc" : "desc")}}}
                        className={(sortOption === 'l'? ((dirOption === "desc") ? "descending" : "ascending") : "")}
                        >
                            L
                        </Link>
                    </div>
                    <div className="px-4 leading-loose text-center w-52">
                        <Link
                        href={{pathname: leaderboard_url + "/" + (1), query: {sort: "r", dir: ((sortOption === 'r' && dirOption === "desc") ? "asc" : "desc")}}}
                        className={(sortOption === 'r'? ((dirOption === "desc") ? "descending" : "ascending") : "")}
                        >
                            W/L Ratio
                        </Link>
                    </div>
                </div>
                {playerStatsQuery.map((playerStats: {discordId: string, rating: number, wins: number, losses: number}, ranking: number) => (
                    <div className="flex flex-wrap justify-center w-3/4 gap-4">
                        <div className="w-1/4 px-4 pl-8 leading-loose text-left">{(ranking+1) + ((lbpage - 1) * playersPerLBPage)}. {playerStats.discordId}</div>
                        <div className="flex items-start justify-center px-4 leading-loose align-middle w-52">{getRankIcon(playerStats.rating)} {playerStats.rating}</div>
                        <div className="w-20 px-4 leading-loose text-center">{playerStats.wins}</div>
                        <div className="w-20 px-4 leading-loose text-center">{playerStats.losses}</div>
                        <div className="px-4 leading-loose text-center w-52">{(playerStats.wins / (playerStats.wins + playerStats.losses)).toFixed(2)}</div>
                    </div>
                ))}
                {generatePageButtons(playerCount, playersPerLBPage, lbpage, sortOption, dirOption)}
            </div>
            <br />
        </>
    )
}


const getRankIcon = (eloScore: number) => {
    var rankIconSrc: string = "/rankedicons/"
    var altTag: string;
    if (eloScore >= 1800) {
        rankIconSrc = rankIconSrc + "diamond_v002.png";
        altTag = "Diamond";
    }
    else if (eloScore >= 1500) {
        rankIconSrc = rankIconSrc + "platinum_v002.png";
        altTag = "Platinum";
    }
    else if (eloScore >= 1300) {
        rankIconSrc = rankIconSrc + "03_gold.png";
        altTag = "Gold";
    }
    else if (eloScore >= 1100) {
        rankIconSrc = rankIconSrc + "02_silver.png";
        altTag = "Silver";
    }
    else {
        rankIconSrc = rankIconSrc + "01_bronze.png";
        altTag = "Bronze";
    }
    return (
        <Image src={rankIconSrc} alt={altTag} width="24" height="0" />
    )
}


const getSearchParamsString = (sortOptions: {sort: string, dir: string}) => {
    const searchOption = sortOptions?.sort;
    const dirOption = sortOptions?.dir;
    if (!searchOption && !dirOption) {
        return '';
    }
    var urlQueryAddOn = '?';
    if (searchOption) {
        urlQueryAddOn = urlQueryAddOn + 'sort=' + searchOption;
    }
    if (dirOption) {
        if (urlQueryAddOn[urlQueryAddOn.length-1] != '?') {
            urlQueryAddOn = urlQueryAddOn + '&';
        }
        urlQueryAddOn = urlQueryAddOn + 'dir=' + dirOption;
    }

    return urlQueryAddOn;
}

const getSortLinkText = (sortText: string, sortOptions: {sort: string, dir: string}) => {
    
}