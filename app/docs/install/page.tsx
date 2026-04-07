import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import { DocCallout } from "@/components/docs/doc-callout";
import { DocSection } from "@/components/docs/doc-section";
import { InstallDownloadsGrid } from "@/components/docs/install-downloads";
import { InstallGameKeySection } from "@/components/docs/install-game-key";
import { InstallPageHero } from "@/components/docs/install-hero";
import { InstallStepsTimeline } from "@/components/docs/install-steps-timeline";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = {
  title: "How to Install Shadowrun FPS on PC | Step-by-Step Guide",
  description:
    "Learn how to install the 2007 Shadowrun FPS on PC with our detailed guide. Download links, setup instructions, and troubleshooting tips.",
  keywords: [
    "Shadowrun FPS Install",
    "How to install Shadowrun PC",
    "Shadowrun 2007 game setup",
    "Shadowrun troubleshooting",
    "Games for Windows Live Shadowrun",
  ],
  openGraph: {
    title: "Install Shadowrun FPS on PC | Easy Setup Guide",
    description:
      "Follow our simple step-by-step guide to install Shadowrun FPS on PC. Get download links, setup tips, and join the community!",
    url: "https://ShadowrunFPS.com/docs/install",
    type: "website",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Installation Guide",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Install Shadowrun FPS on PC | Easy Setup Guide",
    description:
      "Follow our simple step-by-step guide to install Shadowrun FPS on PC. Get download links, setup tips, and join the community!",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Installation Guide",
      },
    ],
  },
};

export default function InstallPage() {
  return (
    <DocLayout>
      <article>
        <InstallPageHero />

        <div className="space-y-10 pt-6 sm:space-y-12 sm:pt-8 md:space-y-14 md:pt-10">
          <DocSection
            id="getting-started"
            eyebrow="Downloads"
            title="Required tools"
          >
            <InstallDownloadsGrid />
          </DocSection>

          <DocSection
            id="installation-steps"
            eyebrow="Walkthrough"
            title="Installation steps"
          >
            <div className="rounded-2xl border border-border/50 bg-card/25 p-4 shadow-sm sm:p-6 md:p-8">
              <InstallStepsTimeline />
            </div>
          </DocSection>

          <DocSection
            id="post-install"
            eyebrow="After install"
            title="Post-installation tips"
          >
            <div className="space-y-4">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>
                    Configure graphics settings for your system. The
                    game&apos;s resolution will likely not match your screen on
                    first load.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>
                    Set up your controls and key bindings through the main menu.
                    Settings → Gamepad
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>
                    Join the community{" "}
                    <a
                      href="discord://discord.com/servers/this-is-shadowrun-930362820627943495"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      Discord
                    </a>{" "}
                    for support.
                  </span>
                </li>
              </ul>
              <DocCallout variant="note" title="Before you play online">
                <p>
                  Configure FPS limits and graphics settings before online
                  matches. See our{" "}
                  <Link
                    href="/docs/troubleshoot#performance"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    performance guide
                  </Link>{" "}
                  for detailed settings.
                </p>
              </DocCallout>
            </div>
          </DocSection>

          <DocSection id="game-key" eyebrow="GFWL" title="Obtaining a game key">
            <InstallGameKeySection />
          </DocSection>

          <DocSection
            id="matchmaking"
            eyebrow="In-game"
            title="Matchmaking preferences"
          >
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground sm:text-base">
                Please update your in-game matchmaking preferences:
              </p>
              <ul className="space-y-2.5 text-sm text-muted-foreground sm:text-base">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>Deselect &apos;8&apos; and &apos;12&apos; player options</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                  <span>Deselect small map variations</span>
                </li>
              </ul>
              <DocCallout variant="note" title="Why this matters">
                <p>
                  These default preferences can limit lobby size automatically,
                  preventing 16-player matches.
                </p>
              </DocCallout>
            </div>
          </DocSection>

          <DocSection id="requirements" eyebrow="Specs" title="System requirements">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/60 bg-card/40 shadow-sm">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">
                    Minimum requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <ul className="space-y-2.5 text-sm text-muted-foreground sm:text-base">
                    {[
                      "Windows 7 or later",
                      "2GB RAM",
                      "DirectX 9.0c",
                      "10GB available space",
                      "Internet connection for multiplayer",
                      "Microsoft account",
                    ].map((line) => (
                      <li key={line} className="flex items-start gap-2">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                        <span>{line}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/40 shadow-sm">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Recommended</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <ul className="space-y-2.5 text-sm text-muted-foreground sm:text-base">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>Windows 10/11</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>4GB RAM</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>DirectX 11</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>15GB available space</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>Stable internet connection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                      <span>
                        Open NAT. See{" "}
                        <a
                          href="https://support.xbox.com/en-US/help/hardware-network/connect-network/xbox-one-nat-error"
                          className="font-medium text-primary underline-offset-4 hover:underline"
                        >
                          Xbox NAT help
                        </a>{" "}
                        for more info.
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </DocSection>

          <DocSection eyebrow="Continue" title="What&apos;s next?">
            <p className="text-sm text-muted-foreground sm:text-base">
              Now that you&apos;ve installed Shadowrun FPS, here are some
              recommended next steps:
            </p>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Link
                href="/docs/troubleshoot#performance"
                className="group flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
              >
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="font-semibold leading-snug text-foreground underline-offset-4 decoration-transparent transition-[color,text-decoration-color] group-hover:text-primary group-hover:underline group-hover:decoration-primary/60">
                    Configure performance
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    Set up FPS limits and graphics settings for optimal gameplay
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
              <a
                href="discord://discord.com/servers/this-is-shadowrun-930362820627943495"
                className="group flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
              >
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="font-semibold leading-snug text-foreground underline-offset-4 decoration-transparent transition-[color,text-decoration-color] group-hover:text-primary group-hover:underline group-hover:decoration-primary/60">
                    Join the community
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    Connect with other players, find matches, and get support
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </a>
            </div>
          </DocSection>
        </div>
      </article>
    </DocLayout>
  );
}
