import { Trophy } from "lucide-react";

export function RankingsHero() {
  return (
    <div className="mb-6 sm:mb-8">
      <div className="mb-3 flex items-center gap-3">
        <div className="relative shrink-0 rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/20 to-primary/10 p-2.5 shadow-lg shadow-primary/10">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/40 to-transparent opacity-50" />
          <Trophy className="relative h-6 w-6 text-primary drop-shadow-sm sm:h-7 sm:w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
            Team Rankings
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground sm:text-base">
            Global rankings for all competitive teams. The{" "}
            <span className="text-foreground/90">team ELO</span> column is each
            team&apos;s aggregate rating (not average ELO per member). Ties on the active
            sort use: win rate → wins → tournament wins → name.
          </p>
        </div>
      </div>
    </div>
  );
}
