"use client";

import { BASE_URL } from "@/components/baseurl";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

import "./leaderboardStyles.css"


const leaderboard_url = BASE_URL + "/leaderboard"


export default function LeaderboardCategory ({category, sortingAbbreviation, twClasses, sortable=true}: {category: string, sortingAbbreviation: string, twClasses: string, sortable?: boolean}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    if (!searchParams.get('sort')) {
        router.push("/leaderboard/?sort=e&dir=desc&page=1");
        return;
    }
    const selected = sortable ? (searchParams.get('sort') == sortingAbbreviation ? true : false) : false;
    const descending = selected ? (searchParams.get('dir') == 'desc' ? true : false) : false; 

    function handleClick () {
        const params = new URLSearchParams(searchParams);
        descending ? params.set("dir", "asc") : params.set("dir", "desc");
        params.set("page", "1");
        params.set("sort", sortingAbbreviation);
        router.push("/leaderboard/?" + params);
    }


    return (
        <>
            <Button className={{twClasses} + (selected ? (descending ? " descending" : " ascending") : "")} variant="link" onClick={handleClick}>{category}</Button>
        </>
    )
}