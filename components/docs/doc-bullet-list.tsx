import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function DocBulletList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ul className={cn("space-y-2", className)}>{children}</ul>;
}

export function DocBulletItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
      <span className="text-muted-foreground">{children}</span>
    </li>
  );
}
