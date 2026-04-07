import Link from "next/link";
import { Download, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import LauncherRecommendation from "@/components/launcher-recommendation";

const ENABLE_DOWNLOAD_PAGE =
  process.env.NEXT_PUBLIC_ENABLE_DOWNLOAD_PAGE === "true";

export function InstallPageHero() {
  return (
    <div className="w-full border-b border-border/40 pb-6 pt-2 sm:pb-8 sm:pt-0">
      <div className="w-full space-y-4 sm:space-y-5">
        <div className="space-y-2 sm:space-y-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            PC setup
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-[2.5rem] md:leading-tight">
            Install Shadowrun FPS (2007)
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Complete installation guide for setting up Shadowrun FPS on your
            PC. Follow these steps carefully for a smooth install.
          </p>
          <p className="text-sm text-muted-foreground/90">
            Typical time:{" "}
            <span className="font-medium text-foreground">30–45 minutes</span>
            {" · "}
            <span className="font-medium text-foreground">Intermediate</span>{" "}
            (external downloads, GFWL, file extraction)
          </p>
        </div>

        <LauncherRecommendation />

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <Button variant="outline" size="default" asChild className="w-full sm:w-auto">
            <Link href="/docs/troubleshoot" className="gap-2">
              <Wrench className="h-4 w-4" aria-hidden />
              Troubleshooting guide
            </Link>
          </Button>
          {ENABLE_DOWNLOAD_PAGE ? (
            <Button variant="secondary" size="default" asChild className="w-full sm:w-auto">
              <Link href="/download" className="gap-2">
                <Download className="h-4 w-4" aria-hidden />
                Launcher install
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
