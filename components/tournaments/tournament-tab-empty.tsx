"use client";

import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TournamentTabEmptyProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  footer?: React.ReactNode;
  className?: string;
};

export function TournamentTabEmpty({
  icon: Icon,
  title,
  description,
  footer,
  className,
}: TournamentTabEmptyProps) {
  return (
    <Card
      className={cn(
        "border-2 border-dashed border-border/60 bg-muted/5",
        className,
      )}
    >
      <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:py-12">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-border/60 bg-background/80 sm:h-16 sm:w-16">
          <Icon className="h-7 w-7 text-muted-foreground sm:h-8 sm:w-8" aria-hidden />
        </div>
        <h3 className="mb-2 text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="max-w-md text-sm text-muted-foreground sm:text-base">
          {description}
        </p>
        {footer ? <div className="mt-4">{footer}</div> : null}
      </CardContent>
    </Card>
  );
}
