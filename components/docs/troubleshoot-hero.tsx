import Link from "next/link";
import { BookOpen, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DocCallout } from "@/components/docs/doc-callout";

const DISCORD_HREF =
  "discord://discord.com/servers/this-is-shadowrun-930362820627943495";

export function TroubleshootPageHero() {
  return (
    <div className="w-full border-b border-border/40 pb-6 pt-2 sm:pb-8 sm:pt-0">
      <div className="w-full space-y-4 sm:space-y-5">
        <div className="space-y-2 sm:space-y-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            Support
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-[2.5rem] md:leading-tight">
            Troubleshooting
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Fixes for common errors, activation, performance, controllers, and
            networking. Start with{" "}
            <strong className="font-medium text-foreground">Common errors</strong>{" "}
            if you have a specific message or code.
          </p>
          <p className="text-sm text-muted-foreground/90">
            Estimated read:{" "}
            <span className="font-medium text-foreground">12–18 minutes</span>
            {" · "}
            Covers{" "}
            <span className="font-medium text-foreground">
              GFWL, FPS limits, input, NAT
            </span>
          </p>
        </div>

        <DocCallout variant="note" title="Quick navigation">
          <p>
            Jump to{" "}
            <a
              href="#errors"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Common errors
            </a>{" "}
            for fast answers, or review the{" "}
            <Link
              href="/docs/install"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              install guide
            </Link>{" "}
            if setup is still in progress.
          </p>
        </DocCallout>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Button variant="default" size="default" asChild className="w-full sm:w-auto">
            <a href="#errors" className="gap-2">
              Common errors
              <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
            </a>
          </Button>
          <Button variant="outline" size="default" asChild className="w-full sm:w-auto">
            <Link href="/docs/install" className="gap-2">
              <BookOpen className="h-4 w-4" aria-hidden />
              Install guide
            </Link>
          </Button>
          <Button variant="secondary" size="default" asChild className="w-full sm:w-auto">
            <a href={DISCORD_HREF} className="gap-2">
              <MessageCircle className="h-4 w-4" aria-hidden />
              Ask on Discord
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}
