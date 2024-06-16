"use client";

import { useState, useMemo, useEffect, useCallback, SVGProps } from "react";
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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar"; // Assuming the path is correct
import Link from "next/link";
import { BASE_URL } from "@/lib/baseurl";
import { Match } from "@/types/types";

type MatchKeys = keyof Match;

export default function MatchHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(15);
  const [matches, setMatches] = useState<Match[]>([]);
  const [sortColumn, setSortColumn] = useState<MatchKeys>("createdTS");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  // useCallback to memoize the fetchMatches function
  const fetchMatches = useCallback(() => {
    fetch(`/api/matches`)
      .then((res) => res.json())
      .then((data) => {
        const sortedMatches = data.results.sort((a: Match, b: Match) => {
          const aValue = a[sortColumn];
          const bValue = b[sortColumn];

          if (aValue === undefined || bValue === undefined) {
            return 0;
          }

          if (sortDirection === "asc") {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });

        setMatches(sortedMatches);
      })
      .catch((error) => {
        console.error("Error fetching matches: ", error);
      });
  }, [sortColumn, sortDirection]); // Dependency array includes sortColumn and sortDirection

  useEffect(() => {
    fetchMatches(); // Initial fetch when sortColumn or sortDirection changes
  }, [fetchMatches]); // useEffect depends only on fetchMatches

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedDate]);

  const handleSort = (column: MatchKeys) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const matchDate = new Date(match.createdTS);
      const matchDateOnly = new Date(
        matchDate.getFullYear(),
        matchDate.getMonth(),
        matchDate.getDate()
      );

      if (selectedDate) {
        const selectedDateOnly = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate()
        );

        return matchDateOnly.getTime() === selectedDateOnly.getTime();
      } else {
        return true;
      }
    });
  }, [matches, selectedDate]);

  const totalPages = Math.ceil(filteredMatches.length / resultsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleClear = () => {
    setSearchTerm("");
    setSelectedDate(undefined);
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

  const getSortIndicator = (column: MatchKeys) => {
    if (sortColumn === column) {
      return sortDirection === "asc" ? "\u2191" : "\u2193";
    }
    return null;
  };

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
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="mr-4">
              Select Date
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(day) => setSelectedDate(day ?? undefined)}
            />
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="sm" onClick={handleClear}>
          Clear
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead onClick={() => handleSort("title")}>
              Title {getSortIndicator("title")}
            </TableHead>
            <TableHead onClick={() => handleSort("status")}>
              Status {getSortIndicator("status")}
            </TableHead>
            <TableHead onClick={() => handleSort("eloTier")}>
              ELO Tier {getSortIndicator("eloTier")}
            </TableHead>
            <TableHead onClick={() => handleSort("teamSize")}>
              Team Size {getSortIndicator("teamSize")}
            </TableHead>
            <TableHead onClick={() => handleSort("winner")}>
              Winner {getSortIndicator("winner")}
            </TableHead>
            <TableHead onClick={() => handleSort("createdTS")}>
              Date and Time {getSortIndicator("createdTS")}
            </TableHead>
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
                    <DropdownMenuItem disabled={true}>
                      Download Match Report
                    </DropdownMenuItem>
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
