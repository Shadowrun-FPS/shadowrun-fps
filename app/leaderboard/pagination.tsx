"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";

type PaginationProps = {
  playerCount: number;
  playersPerPage: number;
  page: number;
};

export default function Pagination({
  playerCount,
  playersPerPage,
  page,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleClick(pageNumber: number): any {
    /* @ts-ignore */
    // TODO fix ts ignore on searchParams
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    router.push("/leaderboard/?" + params);
  }

  const rows = [];
  var skipButtons = false;
  for (var i = 0; i * playersPerPage < playerCount + playersPerPage; i += 1) {
    let pageNumber = i + 1;
    if (
      i > 0 &&
      Math.abs(i + 1 - page) > 2 &&
      (i + 1) * playersPerPage < playerCount
    ) {
      console.log("Skipping", i);
      if (skipButtons) continue;
      rows.push(<span>...</span>);
      skipButtons = true;
      continue;
    }
    skipButtons = false;
    rows.push(
      <Button
        size="sm"
        className={i === page - 1 ? "bg-slate-300" : "bg-slate-600"}
        onClick={(_) => handleClick(pageNumber)}
      >
        {pageNumber}
      </Button>
    );
  }
  return <div className="flex justify-between w-1/3">{rows}</div>;
}
