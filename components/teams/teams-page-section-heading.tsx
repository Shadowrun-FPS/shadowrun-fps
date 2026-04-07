"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type TeamsPageSectionHeadingProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  className?: string;
};

export function TeamsPageSectionHeading({
  icon: Icon,
  title,
  description,
  className,
}: TeamsPageSectionHeadingProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="relative shrink-0 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-2 shadow-sm">
        <Icon className="h-5 w-5 text-primary" aria-hidden />
      </div>
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl lg:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-0.5 text-xs text-foreground/70 sm:text-sm">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
