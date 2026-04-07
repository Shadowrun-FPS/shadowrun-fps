"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { TeamCard } from "@/components/teams/team-card";
import type { TeamMember as MongoTeamMember } from "@/types/mongodb";
import type { TeamListing } from "@/types";
import { TeamsPageSectionHeading } from "@/components/teams/teams-page-section-heading";

type MyTeamsCarouselProps = {
  userTeams: TeamListing[];
};

export function MyTeamsCarousel({ userTeams }: MyTeamsCarouselProps) {
  const sortedUserTeams = useMemo(() => {
    return [...userTeams].sort((a, b) => {
      const sizeA = a.teamSize || 4;
      const sizeB = b.teamSize || 4;
      return sizeA - sizeB;
    });
  }, [userTeams]);

  const defaultIndex = useMemo(() => {
    const fourVFourIndex = sortedUserTeams.findIndex((team) => (team.teamSize || 4) === 4);
    if (fourVFourIndex !== -1) return fourVFourIndex;
    return 0;
  }, [sortedUserTeams]);

  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);

  useEffect(() => {
    if (carouselApi && typeof window !== "undefined") {
      const isMobile = window.innerWidth < 640;
      if (isMobile) {
        carouselApi.scrollTo(defaultIndex);
      }
    }
  }, [carouselApi, defaultIndex]);

  return (
    <>
      <div className="mb-8 mt-8 sm:mb-10 sm:mt-12">
        <TeamsPageSectionHeading icon={Star} title="My Teams" className="mb-4 sm:mb-6" />
        <section aria-label="Your teams carousel">
          <Carousel className="w-full" setApi={setCarouselApi}>
            <CarouselContent className="-ml-2 md:-ml-4">
              {sortedUserTeams.map((team) => {
                const teamSize = team.teamSize || 4;
                return (
                  <CarouselItem
                    key={team._id}
                    className="basis-full pl-2 sm:basis-1/2 md:pl-4 lg:basis-1/3"
                  >
                    <div className="space-y-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs font-semibold">
                          {teamSize === 2
                            ? "2v2"
                            : teamSize === 3
                              ? "3v3"
                              : teamSize === 4
                                ? "4v4"
                                : "5v5"}{" "}
                          ({teamSize} players)
                        </Badge>
                      </div>
                      <TeamCard
                        _id={team._id}
                        name={team.name}
                        description={team.description}
                        tag={team.tag}
                        members={team.members as MongoTeamMember[]}
                        wins={team.wins || 0}
                        losses={team.losses || 0}
                        tournamentWins={team.tournamentWins || 0}
                        userTeam={team}
                        isUserTeam
                        teamElo={team.teamElo}
                        teamSize={team.teamSize}
                      />
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <div className="mt-4 flex justify-center gap-2">
              <CarouselPrevious
                className="static translate-y-0"
                aria-label="Previous team"
              />
              <CarouselNext className="static translate-y-0" aria-label="Next team" />
            </div>
          </Carousel>
        </section>
      </div>
      <Separator className="my-8" />
    </>
  );
}
