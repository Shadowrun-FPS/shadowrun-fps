import { FlaskConical } from "lucide-react";

import { MatchesBrowser } from "@/components/matches/matches-browser";
export default function MatchesPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-5xl space-y-4 px-3 pb-10 pt-4 sm:space-y-6 sm:px-6 sm:pt-8 lg:px-8">
      <div
        role="note"
        className="flex items-start gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs sm:text-sm"
      >
        <FlaskConical
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          aria-hidden="true"
        />
        <p>
          <strong>Mockup data.</strong> Hidden behind a feature flag; shows
          sample matches until the dedicated server is connected.
        </p>
      </div>

      <MatchesBrowser />
    </div>
  );
}
