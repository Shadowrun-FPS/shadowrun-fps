"use client";

import { useState, useMemo, useEffect, SVGProps } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationLink,
  PaginationNext,
} from "@/components/ui/pagination";
import Link from "next/link";
import { BASE_URL } from "@/lib/baseurl";
import { Match } from "@/types/types";

export default function MatchHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(15);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    fetchMatches();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  function fetchMatches() {
    fetch(`/api/matches`)
      .then((res) => res.json())
      .then((data) => {
        const sortedMatches = data.results.sort((a: Match, b: Match) => {
          return b.createdTS - a.createdTS;
        });

        console.log("sorted matches: ", sortedMatches);
        setMatches(sortedMatches);
      })
      .catch((error) => {
        console.error("Error fetching matches: ", error);
      });
  }

  const filteredMatches = useMemo(() => {
    return matches.filter((match) =>
      Object.values(match).some(
        (value) =>
          typeof value === "string" &&
          value.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [matches, searchTerm]);

  const totalPages = Math.ceil(filteredMatches.length / resultsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClear = () => {
    setSearchTerm("");
  };

  const formatDate = (dateString: string | number | Date) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    };
    return date.toLocaleString("en-US", options);
  };

  const formatTeamSize = (teamSize: number) => {
    return `${teamSize}v${teamSize}`;
  };

  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentMatches = filteredMatches.slice(startIndex, endIndex);

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Match History</h1>
        <p className="text-gray-500 dark:text-gray-400">
          {filteredMatches.length} results found
        </p>
      </div>
      <div className="flex items-center mb-4">
        <Input
          placeholder="Search matches..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 mr-4"
        />
        <Button variant="outline" size="sm" onClick={handleClear}>
          Clear
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>ELO Tier</TableHead>
            <TableHead>Team Size</TableHead>
            <TableHead>Winner</TableHead>
            <TableHead>Date and Time</TableHead>
            <TableHead className="text-right"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="capitalize">
          {currentMatches.map((match, index) => (
            <TableRow key={index}>
              <TableCell>{match.title}</TableCell>
              <TableCell>{match.status}</TableCell>
              <TableCell>{match.eloTier}</TableCell>
              <TableCell>{formatTeamSize(match.teamSize)}</TableCell>
              <TableCell>{match.winner}</TableCell>
              <TableCell>{formatDate(match.createdTS)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <DotIcon className="w-4 h-4 mr-2" />
                      View Match
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48">
                    <DropdownMenuItem>
                      <Link href={`${BASE_URL}/matches/${match.matchId}`}>
                        View Match Details
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem>Download Match Report</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="flex justify-end mt-4">
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={() => handlePageChange(currentPage - 1)}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <PaginationItem key={page}>
                <PaginationLink
                  href="#"
                  onClick={() => handlePageChange(page)}
                  isActive={page === currentPage}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={() => handlePageChange(currentPage + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}

function DotIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12.1" cy="12.1" r="1" />
    </svg>
  );
}
