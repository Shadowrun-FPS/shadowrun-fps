"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface Match {
  team1: string;
  team2: string;
  score1: number;
  score2: number;
  winner?: string;
}

interface Round {
  matches: Match[];
}

interface BracketProps {
  rounds: Round[];
  onMatchClick?: (roundIndex: number, matchIndex: number) => void;
}

export function TournamentBracket({ rounds, onMatchClick }: BracketProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Clear existing lines
    const svg = svgRef.current;
    while (svg.firstChild) {
      svg.removeChild(svg.firstChild);
    }

    // Draw connecting lines between matches
    const matches = document.querySelectorAll(".match-card");
    matches.forEach((match, i) => {
      if (i % 2 === 0 && i < matches.length - 1) {
        const rect1 = match.getBoundingClientRect();
        const rect2 = matches[i + 1].getBoundingClientRect();
        const svgRect = svg.getBoundingClientRect();

        const line = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path"
        );
        const x1 = rect1.right - svgRect.left;
        const y1 = (rect1.top + rect1.bottom) / 2 - svgRect.top;
        const x2 = rect2.right - svgRect.left;
        const y2 = (rect2.top + rect2.bottom) / 2 - svgRect.top;
        const xm = x1 + 20;

        line.setAttribute(
          "d",
          `M ${x1} ${y1} L ${xm} ${y1} L ${xm} ${y2} L ${x2} ${y2}`
        );
        line.setAttribute("stroke", "currentColor");
        line.setAttribute("stroke-width", "2");
        line.setAttribute("fill", "none");
        line.setAttribute("opacity", "0.3");
        svg.appendChild(line);
      }
    });
  }, [rounds]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 0 }}
      />
      <div className="relative z-10 flex gap-8">
        {rounds.map((round, roundIndex) => (
          <div key={roundIndex} className="flex flex-col gap-8">
            <div className="text-sm font-medium text-muted-foreground">
              Round {roundIndex + 1}
            </div>
            {round.matches.map((match, matchIndex) => (
              <Card
                key={matchIndex}
                className="match-card p-4 w-64 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onMatchClick?.(roundIndex, matchIndex)}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span
                      className={
                        match.winner === match.team1 ? "font-bold" : ""
                      }
                    >
                      {match.team1}
                    </span>
                    <span>{match.score1}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span
                      className={
                        match.winner === match.team2 ? "font-bold" : ""
                      }
                    >
                      {match.team2}
                    </span>
                    <span>{match.score2}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
