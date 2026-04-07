import * as React from "react";
import { AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type DocCalloutVariant = "note" | "warning";

interface DocCalloutProps {
  variant?: DocCalloutVariant;
  title: string;
  children: React.ReactNode;
  className?: string;
}

export function DocCallout({
  variant = "note",
  title,
  children,
  className,
}: DocCalloutProps) {
  const isWarning = variant === "warning";

  return (
    <div
      role={isWarning ? "alert" : "note"}
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        isWarning
          ? "border-amber-500/35 bg-amber-500/[0.08] dark:border-amber-600/40 dark:bg-amber-950/25"
          : "border-primary/25 bg-primary/[0.06]",
        className
      )}
    >
      {isWarning ? (
        <AlertTriangle
          className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden
        />
      ) : (
        <Info
          className="mt-0.5 h-5 w-5 shrink-0 text-primary"
          aria-hidden
        />
      )}
      <div className="min-w-0 space-y-1.5">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <div className="text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline">
          {children}
        </div>
      </div>
    </div>
  );
}
