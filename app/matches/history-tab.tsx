"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";

export default function MatchHistoryTab() {
  const router = useRouter();
  const [filter, setFilter] = useState({
    status: "all",
    eloTier: "all",
    teamSize: "all",
  });

  // ... pagination state and fetch logic here

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter matches..."
          className="max-w-sm"
          onChange={(e) => {
            /* implement filter */
          }}
        />
        <div className="flex gap-2">
          <Select
            value={filter.eloTier}
            onValueChange={(value) => setFilter({ ...filter, eloTier: value })}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="ELO Tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filter.teamSize}
            onValueChange={(value) => setFilter({ ...filter, teamSize: value })}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Team Size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sizes</SelectItem>
              <SelectItem value="1v1">1v1</SelectItem>
              <SelectItem value="2v2">2v2</SelectItem>
              <SelectItem value="4v4">4v4</SelectItem>
              <SelectItem value="5v5">5v5</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() =>
              setFilter({
                status: "all",
                eloTier: "all",
                teamSize: "all",
              })
            }
          >
            Clear
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>ELO Tier</TableHead>
            <TableHead>Team Size</TableHead>
            <TableHead>Winner</TableHead>
            <TableHead>Date and Time</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>{/* Map through matches */}</TableBody>
      </Table>

      {/* Pagination controls */}
    </div>
  );
}
