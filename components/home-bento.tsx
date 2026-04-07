"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, ChevronRight, Gamepad2, Wrench } from "lucide-react";
import DownloadButton from "@/components/download-button";
import { ScrollReveal } from "@/components/scroll-reveal";
import { HomeSectionHeading } from "@/components/home-section-heading";
import { cn } from "@/lib/utils";

const DISCORD_HREF =
  "discord://discord.com/servers/this-is-shadowrun-930362820627943495";

const XBOX_STORE_HREF =
  "https://www.xbox.com/en-us/games/store/Shadowrun/BSNJBK3GBDT3";

function BentoCard({
  className,
  children,
  staggerIndex,
}: {
  className?: string;
  children: ReactNode;
  staggerIndex: number;
}) {
  return (
    <ScrollReveal staggerIndex={staggerIndex}>
      <div
        className={cn(
          "relative flex h-full flex-col overflow-hidden rounded-2xl bg-card/20 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-card/28 sm:p-8",
          className
        )}
      >
        {children}
      </div>
    </ScrollReveal>
  );
}

export function HomeBento() {
  return (
    <div className="mx-auto max-w-5xl">
      <ScrollReveal>
        <HomeSectionHeading>Getting Started</HomeSectionHeading>
      </ScrollReveal>

      <div className="flex min-w-0 flex-col gap-4 lg:gap-5">
        <div className="grid min-w-0 gap-4 lg:grid-cols-2 lg:items-stretch lg:gap-5">
          <BentoCard staggerIndex={0} className="justify-between">
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-primary/90">
                Play on PC
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Install & jump in
              </h3>
              <p className="mt-2 max-w-xl text-sm text-muted-foreground sm:text-base">
                Grab the launcher or follow the install guide—everything you
                need to run Shadowrun FPS on Windows 10+.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground/90">
                Note: Manual installation supports Windows Vista and newer.
              </p>
            </div>
            <div className="mt-6 w-full max-w-md">
              <DownloadButton />
            </div>
          </BentoCard>

          <BentoCard
            staggerIndex={1}
            className="justify-between bg-gradient-to-b from-[var(--xbox-brand)]/8 to-card/22"
          >
            <div>
              <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[var(--xbox-brand)]/95">
                Play on Xbox
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                Get it on the Xbox Store
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Purchase Shadowrun for Xbox consoles through the Microsoft
                Store—backward compatible on modern Xbox hardware.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground/90">
                Note: The Xbox release is capped at 30 FPS, including on all newer
                Xbox consoles.
              </p>
            </div>
            <Link
              href={XBOX_STORE_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative mt-6 flex w-full max-w-md items-center justify-center overflow-hidden rounded-xl bg-[var(--xbox-brand)] px-6 py-3 text-lg font-medium text-white transition-colors hover:bg-[var(--xbox-brand)]/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--xbox-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Open Shadowrun on the Xbox store (opens in a new tab)"
            >
              <span className="relative z-10 flex items-center underline-offset-4 decoration-transparent transition-[text-decoration-color] group-hover:underline group-hover:decoration-white/80">
                <Gamepad2 className="mr-2 h-5 w-5 shrink-0" />
                Buy on Xbox
              </span>
              <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[var(--xbox-brand)] to-[var(--xbox-brand)]/90 transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 z-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-500 group-hover:translate-x-[100%]" />
            </Link>
          </BentoCard>
        </div>

        <BentoCard staggerIndex={2} className="w-full min-w-0">
          <div>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Documentation
            </p>
            <h3 className="mt-1 font-display text-xl font-bold text-foreground sm:text-2xl">
              Guides & fixes
            </h3>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Step-by-step install and troubleshooting—bookmark these for when
              you need them.
            </p>
          </div>
          <div className="mt-6 grid min-w-0 grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2">
            <Link
              href="/docs/install"
              className="group flex min-h-[4.5rem] items-center gap-3 rounded-xl bg-muted/10 px-4 py-4 transition-colors hover:bg-muted/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-5 sm:py-5"
            >
              <BookOpen className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 text-left">
                <div className="font-semibold leading-snug text-foreground underline-offset-4 decoration-transparent transition-[text-decoration-color] group-hover:underline group-hover:decoration-primary/60">
                  Manual Installation guide
                </div>
                <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  From download to first match
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
            <Link
              href="/docs/troubleshoot"
              className="group flex min-h-[4.5rem] items-center gap-3 rounded-xl bg-muted/10 px-4 py-4 transition-colors hover:bg-muted/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-5 sm:py-5"
            >
              <Wrench className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 text-left">
                <div className="font-semibold leading-snug text-foreground underline-offset-4 decoration-transparent transition-[text-decoration-color] group-hover:underline group-hover:decoration-primary/60">
                  Troubleshooting
                </div>
                <div className="mt-0.5 text-xs leading-snug text-muted-foreground">
                  Performance, errors, and fixes
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </Link>
          </div>
        </BentoCard>

        <ScrollReveal staggerIndex={3}>
          <div className="mx-auto flex max-w-lg flex-col items-center rounded-2xl bg-gradient-to-b from-[var(--discord-brand)]/6 to-card/20 px-6 py-8 text-center backdrop-blur-sm sm:px-8">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[var(--discord-brand)]/90">
              Community
            </p>
            <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Discord
            </h3>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              The main hub for finding matches and support.
            </p>
            <Link
              href={DISCORD_HREF}
              className="group mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--discord-brand)]/14 px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-[var(--discord-brand)]/22 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--discord-brand)] focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <span className="underline-offset-4 decoration-transparent transition-[text-decoration-color] group-hover:underline group-hover:decoration-foreground/70">
                Join the server
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}
