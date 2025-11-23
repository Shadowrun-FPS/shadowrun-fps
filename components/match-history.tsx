"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChevronLeft, ChevronRight, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { useMatchStore, type Match } from "@/lib/store"
import { format } from "date-fns"

type SortDirection = "asc" | "desc"
type SortField = "status" | "eloTier" | "teamSize" | "winner" | "date"

export default function MatchHistory() {
  const { matches } = useMatchStore()
  const [currentPage, setCurrentPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState("")
  const [eloTierFilter, setEloTierFilter] = useState("")
  const [teamSizeFilter, setTeamSizeFilter] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")

  const itemsPerPage = 10

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const filteredMatches = matches.filter((match: Match) => {
    return (
      (statusFilter === "" || match.status.toLowerCase().includes(statusFilter.toLowerCase())) &&
      (eloTierFilter === "" || match.eloTier === eloTierFilter) &&
      (teamSizeFilter === "" || match.teamSize === teamSizeFilter)
    )
  })

  const sortedMatches = [...filteredMatches].sort((a, b) => {
    switch (sortField) {
      case "status":
        return sortDirection === "asc" ? a.status.localeCompare(b.status) : b.status.localeCompare(a.status)
      case "eloTier":
        return sortDirection === "asc" ? a.eloTier.localeCompare(b.eloTier) : b.eloTier.localeCompare(a.eloTier)
      case "teamSize":
        return sortDirection === "asc" ? a.teamSize.localeCompare(b.teamSize) : b.teamSize.localeCompare(a.teamSize)
      case "winner":
        return sortDirection === "asc" ? a.winner.localeCompare(b.winner) : b.winner.localeCompare(a.winner)
      case "date":
        return sortDirection === "asc"
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime()
      default:
        return 0
    }
  })

  const paginatedMatches = sortedMatches.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const totalPages = Math.ceil(sortedMatches.length / itemsPerPage)

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const clearFilters = () => {
    setStatusFilter("")
    setEloTierFilter("")
    setTeamSizeFilter("")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Match History</h1>
        <p className="text-sm text-gray-400">{filteredMatches.length} results found</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          placeholder="Filter matches by status..."
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex-1 bg-[#111827] border-[#2d3748]"
        />

        <div className="flex gap-2">
          <div className="w-32">
            <Select value={eloTierFilter} onValueChange={setEloTierFilter}>
              <SelectTrigger className="bg-[#111827] border-[#2d3748]">
                <SelectValue placeholder="ELO tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-32">
            <Select value={teamSizeFilter} onValueChange={setTeamSizeFilter}>
              <SelectTrigger className="bg-[#111827] border-[#2d3748]">
                <SelectValue placeholder="Team Size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="2v2">2v2</SelectItem>
                <SelectItem value="3v3">3v3</SelectItem>
                <SelectItem value="4v4">4v4</SelectItem>
                <SelectItem value="5v5">5v5</SelectItem>
                <SelectItem value="6v6">6v6</SelectItem>
                <SelectItem value="8v8">8v8</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" onClick={clearFilters} className="bg-[#111827] border-[#2d3748] hover:bg-[#1a2234]">
            Clear
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-[#2d3748]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[#1a2234] border-b border-[#2d3748]">
              <TableHead className="w-[150px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status")}
                  className="flex items-center gap-1 p-0 hover:bg-transparent hover:text-white"
                >
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("eloTier")}
                  className="flex items-center gap-1 p-0 hover:bg-transparent hover:text-white"
                >
                  ELO Tier
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("teamSize")}
                  className="flex items-center gap-1 p-0 hover:bg-transparent hover:text-white"
                >
                  Team Size
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("winner")}
                  className="flex items-center gap-1 p-0 hover:bg-transparent hover:text-white"
                >
                  Winner
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort("date")}
                  className="flex items-center gap-1 p-0 hover:bg-transparent hover:text-white"
                >
                  Date and Time
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead className="text-right"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMatches.length > 0 ? (
              paginatedMatches.map((match) => (
                <TableRow key={match.id} className="hover:bg-[#1a2234] border-b border-[#2d3748]">
                  <TableCell className="font-medium">{match.status}</TableCell>
                  <TableCell>{match.eloTier.charAt(0).toUpperCase() + match.eloTier.slice(1)}</TableCell>
                  <TableCell>{match.teamSize}</TableCell>
                  <TableCell>
                    <span className={match.winner === "Lineage" ? "text-blue-400" : "text-red-400"}>
                      {match.winner}
                    </span>
                  </TableCell>
                  <TableCell>{format(new Date(match.date), "MMM d, yyyy, h:mm a")}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" className="bg-[#111827] border-[#2d3748] hover:bg-[#1a2234]">
                      <MoreHorizontal className="h-4 w-4 mr-2" />
                      View Match
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-6 text-gray-400">
                  No matches found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className="bg-[#111827] border-[#2d3748] hover:bg-[#1a2234]"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Previous Page</span>
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
              const pageNumber = i + 1
              return (
                <Button
                  key={i}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(pageNumber)}
                  className={
                    currentPage === pageNumber
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-[#111827] border-[#2d3748] hover:bg-[#1a2234]"
                  }
                >
                  {pageNumber}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="bg-[#111827] border-[#2d3748] hover:bg-[#1a2234]"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Next Page</span>
          </Button>
        </div>
      )}
    </div>
  )
}

