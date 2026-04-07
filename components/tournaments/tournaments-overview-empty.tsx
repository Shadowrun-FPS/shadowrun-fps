"use client";

import type { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TournamentsOverviewEmptyProps = {
  title: string;
  description: string;
  icon: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

export function TournamentsOverviewEmpty({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: TournamentsOverviewEmptyProps) {
  return (
    <Card className="border-2 border-dashed border-border/60 bg-muted/5">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center sm:p-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 sm:h-20 sm:w-20">
          {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
          {title}
        </h3>
        <p className="mb-6 max-w-md text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
        {actionLabel && onAction ? (
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
