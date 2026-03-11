import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface GettingStartedCardProps {
  href: string;
  title: string;
  description: string;
}

export function GettingStartedCard({
  href,
  title,
  description,
}: GettingStartedCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex h-full flex-col p-6 rounded-xl border border-border/50 bg-card/30 backdrop-blur-sm transition-all duration-300 hover:bg-card/50 hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 sm:rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      aria-label={title}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="text-lg font-semibold transition-colors sm:text-xl text-foreground group-hover:text-primary">
            {title}
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground">
            {description}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-primary opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
    </Link>
  );
}
