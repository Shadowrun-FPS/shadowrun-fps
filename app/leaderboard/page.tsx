import Leaderboard from "./[lbpage]/page";

export default function LB() {
    return (
        <Leaderboard params={{lbpage:1}} searchParams={{"sort": "e", "dir":"desc"}}/>
    )
}
// import "@/app/globals.css";
// import { Button } from "@/components/ui/button";
// import { LeaderboardLayout } from "./categoryButton";
// import Link from "next/link";
// import Image from "next/image";

// import React from "react";
// const leaderboard_url = 'http://' + process.env.NEXT_PUBLIC_API_URL + "/leaderboard"

// const getDiscordNicknames = async(playerStatsQuery: string) => {
//     try {
//         const fake = 3;
//     } catch (error) {
//         console.log('Error retrieiving Discord usernames');
//     }
// }


// export default async function Leaderboard() {
//     // const lbpage = Math.max(params.lbpage || 1, 1);
//     return (
//         <>
//             <h1 className="flex justify-center text-3xl font-bold">Leaderboard</h1>
//             <br />
//                 <LeaderboardLayout />
//             <br />
//         </>
//     )
// }
