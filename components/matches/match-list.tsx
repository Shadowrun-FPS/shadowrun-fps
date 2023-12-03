"use client";
import { Match } from "@/types/types";
import { useEffect, useState } from "react";
import MatchCard from "./match-card";
import { getRankedMatches } from "@/lib/match-helpers";
import io from "socket.io-client";
import { createURL } from "@/lib/utils";
const socket = io("http://localhost:3001");

export default function MatchList() {
  const [matches, setMatches] = useState([]);
  useEffect(() => {
    console.log("ranked page mounted");
    const url = createURL("/api/matches", { ranked: true });
    const getRankedMatches = async () => {
      try {
        const response = await fetch(url, {
          cache: "no-store",
        });
        if (response.ok) {
          const data = await response.json();
          console.log("data: ", data);
          //   setMatches(data.results);
        } else {
          throw new Error("Failed to fetch ranked matches");
        }
      } catch (error) {
        console.error("Error fetching ranked matches: ", error);
      }
    };
    getRankedMatches();
  }, []);

  useEffect(() => {
    socket.on("connection", (data: any) => {
      console.log("hello from socket io conneciton");
    });
  }, [socket]);

  return (
    <div className="flex flex-wrap gap-8">
      {matches?.map((match: Match) => {
        return (
          <MatchCard key={match.matchId} className="w-[350px]" match={match} />
        );
      })}
    </div>
  );
}
