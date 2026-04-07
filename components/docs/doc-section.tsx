import * as React from "react";
import { cn } from "@/lib/utils";

interface DocSectionProps {
  id?: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DocSection({
  id,
  eyebrow,
  title,
  children,
  className,
}: DocSectionProps) {
  return (
    <section
      id={id}
      className={cn("scroll-mt-28 space-y-4 sm:space-y-5", className)}
    >
      {eyebrow ? (
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h2>
      {children}
    </section>
  );
}
