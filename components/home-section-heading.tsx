"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HomeSectionHeadingProps = {
  children: ReactNode;
  className?: string;
  as?: "h2" | "h3";
};

export function HomeSectionHeading({
  children,
  className,
  as: Tag = "h2",
}: HomeSectionHeadingProps) {
  return (
    <div className={cn("mb-8 text-center sm:mb-10", className)}>
      <Tag className="font-display relative inline-block text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl">
        {children}
        <span
          className="absolute -bottom-1 left-0 right-0 h-px bg-primary/35"
          aria-hidden
        />
      </Tag>
    </div>
  );
}
