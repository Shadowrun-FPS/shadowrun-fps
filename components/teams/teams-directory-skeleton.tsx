"use client";

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function TeamsDirectorySkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-screen-xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 xl:px-12">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-10 w-full sm:w-72" />
        </div>
        <div className="mb-8 mt-8 flex items-start gap-3 sm:mb-10 sm:mt-12">
          <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-7 w-48 sm:h-8" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <div className="mb-8 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={`t-${i}`} className="overflow-hidden border-2 border-primary/15">
              <div className="space-y-3 p-4 sm:p-6">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-12 w-full" />
                <div className="grid grid-cols-2 gap-2 border-t border-border/40 pt-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
        <div className="mb-8 flex items-start gap-3 sm:mb-10">
          <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-40 sm:h-8" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden border-2">
              <CardHeader className="p-4 sm:p-6">
                <Skeleton className="h-6 w-36" />
                <Skeleton className="mt-2 h-4 w-24" />
              </CardHeader>
              <CardContent className="p-4 pt-0 sm:p-6">
                <Skeleton className="h-16 w-full" />
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
              <CardFooter className="border-t p-4 sm:p-6">
                <div className="flex w-full justify-end gap-2">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
