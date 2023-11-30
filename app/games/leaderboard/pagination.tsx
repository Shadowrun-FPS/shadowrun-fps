"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

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

  function handleClick(pageNumber: number) {
    const params = new URLSearchParams(searchParams.toString());
    const currentPage = params.get("page");
    if (currentPage == pageNumber.toString() || (!currentPage && pageNumber === 1)) return;
    params.set("page", pageNumber.toString());
    router.push("/leaderboard/?" + params);
  }

  const PageButtons = [];
  var skipButtons = false;
  for (var i = 0; i * playersPerPage < playerCount; i += 1) {
    let pageNumber = i + 1;
    if (
      i > 0 &&
      Math.abs(i + 1 - page) > 2 &&
      (i + 1) * playersPerPage < playerCount
    ) {
      if (skipButtons) continue;
      PageButtons.push(<>...</>);
      skipButtons = true;
      continue;
    }
    skipButtons = false;
    PageButtons.push(
      <Button
        size="sm"
        className={i === page - 1 ? "bg-slate-300" : "bg-slate-400 dark:bg-slate-600"}
        onClick={(_) => handleClick(pageNumber)}
        key={pageNumber}
      >
        {pageNumber}
      </Button>
    );
  }
  return (
    <>
      <div className="flex justify-center w-full">
        <div className={"flex content-center w-72" + ( i==1 ? " justify-center" : " justify-between")}>{PageButtons}</div>
      </div>
      <div className="flex justify-center w-full">Showing {(playersPerPage * (page - 1)) + 1} - {Math.min(playerCount, (playersPerPage * (page)))} of {playerCount}</div>
    </>
  );
}
