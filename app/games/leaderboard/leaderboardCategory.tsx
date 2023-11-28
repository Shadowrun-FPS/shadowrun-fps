"use client";

import { BASE_URL } from "@/components/baseurl";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

import "./leaderboardStyles.css"

export default function LeaderboardCategory ({category, sortingAbbreviation, defaultCategory=false}: {category: string, sortingAbbreviation: string, defaultCategory?:boolean, sortable?: boolean}) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selected = !searchParams.get('sort') && defaultCategory ? true : searchParams.get('sort') == sortingAbbreviation ? true : false;
    const descending = selected ? (searchParams.get('dir') == 'desc' || !searchParams.get('dir') ? true : false) : false; 

    function handleClick () {
        const params = new URLSearchParams(searchParams.toString());
        descending ? params.set("dir", "asc") : params.set("dir", "desc");
        params.set("page", "1");
        params.set("sort", sortingAbbreviation);
        router.push("/leaderboard/?" + params);
    }
    return (
        <>
            <Button className={(selected ? (descending ? " descending" : " ascending") : "")} variant="link" onClick={handleClick}>{category}</Button>
        </>
    )
}