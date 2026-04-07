import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download, Gauge } from "lucide-react";
import { DocLayout } from "@/components/layouts/doc-layout";
import { DocBulletItem, DocBulletList } from "@/components/docs/doc-bullet-list";
import { DocCallout } from "@/components/docs/doc-callout";
import { DocSection } from "@/components/docs/doc-section";
import { TroubleshootDiscordCta } from "@/components/docs/troubleshoot-discord-cta";
import { TroubleshootPageHero } from "@/components/docs/troubleshoot-hero";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FAQsSection } from "./faqs-section";

const ENABLE_DOWNLOAD_PAGE =
  process.env.NEXT_PUBLIC_ENABLE_DOWNLOAD_PAGE === "true";

export const metadata: Metadata = {
  title: "Troubleshooting Shadowrun FPS | Common Errors & Fixes",
  description:
    "Fix Shadowrun FPS (2007) on PC: GFWL activation, FPS limits, controllers, NAT, and connection issues. Step-by-step fixes and community support.",
  keywords: [
    "Shadowrun FPS troubleshooting",
    "Shadowrun GFWL activation",
    "Shadowrun FPS errors",
    "Shadowrun PC performance",
    "Games for Windows Live Shadowrun",
    "Shadowrun NAT connection",
  ],
  openGraph: {
    title: "Troubleshooting Shadowrun FPS | Common Errors & Fixes",
    description:
      "Fix activation, performance, controllers, and networking for Shadowrun FPS on PC. Common errors, registry tips, and where to get help.",
    url: "https://ShadowrunFPS.com/docs/troubleshoot",
    type: "website",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Troubleshooting Shadowrun FPS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Troubleshooting Shadowrun FPS | Common Errors & Fixes",
    description:
      "Fix activation, performance, controllers, and networking for Shadowrun FPS on PC.",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Troubleshooting Shadowrun FPS",
      },
    ],
  },
};

export default function TroubleshootPage() {
  return (
    <DocLayout>
      <article>
        <TroubleshootPageHero />

        <div className="space-y-10 pt-6 sm:space-y-12 sm:pt-8 md:space-y-14 md:pt-10">
          <DocSection id="errors" eyebrow="Errors" title="Common errors">
            <div className="space-y-4 sm:space-y-5">
              <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
                Find solutions to common issues and error messages below. Click
                an item to expand the fix.
              </p>
              <div className="rounded-2xl border border-border/50 bg-card/25 p-4 shadow-sm sm:p-6 md:p-8">
                <FAQsSection />
              </div>
            </div>
          </DocSection>

          <DocSection id="activation" eyebrow="GFWL" title="Activation issues">
            <div className="space-y-5">
              <DocCallout variant="warning" title="First launch can be slow">
                <p>
                  First-time activation may take up to 20 minutes to load the
                  key entry page after logging in.
                </p>
              </DocCallout>
              <div className="space-y-3 text-sm sm:text-base">
                <p className="font-semibold text-foreground">
                  If you get &quot;This key has been used too many times&quot;:
                </p>
                <ol className="space-y-2.5">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      1
                    </span>
                    <span className="text-muted-foreground">Click &apos;Retry&apos;</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      2
                    </span>
                    <span className="text-muted-foreground">
                      Wait 5-10 minutes for the key entry window
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      3
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-muted-foreground">
                        If it appears frozen:
                      </span>
                      <DocBulletList className="ml-4 mt-2 space-y-1.5">
                        <DocBulletItem>Use Win-Key + Tab</DocBulletItem>
                        <DocBulletItem>Drag Shadowrun to a second desktop</DocBulletItem>
                        <DocBulletItem>
                          Open Task Manager to end the process if needed
                        </DocBulletItem>
                      </DocBulletList>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
          </DocSection>

          <DocSection
            id="performance"
            eyebrow="Graphics"
            title="Performance settings"
          >
            <div className="space-y-4">
              <Card className="border-border/60 bg-card/40 shadow-sm">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">
                    FPS limitations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 text-sm sm:px-6 sm:text-base">
                  <DocCallout variant="warning" title="Limit your FPS">
                    <p className="mb-2">
                      Parts of the game malfunction when FPS is not limited:
                    </p>
                    <DocBulletList>
                      <DocBulletItem>Firing rate of guns (minigun/smg)</DocBulletItem>
                      <DocBulletItem>In-game physics (gusting/jumping)</DocBulletItem>
                      <DocBulletItem>
                        Gust grenades only work if server host is at 50fps or
                        under
                      </DocBulletItem>
                    </DocBulletList>
                  </DocCallout>
                  <div>
                    <p className="mb-2 font-semibold text-foreground">
                      Recommended FPS limit: 50–98 fps
                    </p>
                    <p className="mb-2 text-sm text-muted-foreground">
                      Set this in{" "}
                      <code className="font-mono text-xs">dxvk.conf</code>
                      {" "}
                      next to the game executable folder.
                    </p>
                    <pre className="mb-3 overflow-x-auto rounded-xl border border-border/50 bg-muted p-3 font-mono text-xs sm:text-sm">
                      <code>
                        dxgi.maxFrameRate = 85{"\n"}d3d9.maxFrameRate = 85
                      </code>
                    </pre>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Community release defaults may differ from the example
                      above. Edit values to stay within 50–98 fps if needed.
                    </p>
                    <Button variant="outline" size="default" asChild className="w-full mt-4 sm:w-auto">
                      <a
                        href="/api/docs/dxvk-conf"
                        download="dxvk.conf"
                        className="inline-flex items-center justify-center gap-2"
                      >
                        <Download className="h-4 w-4 shrink-0" aria-hidden />
                        Download dxvk.conf
                      </a>
                    </Button>
                    
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/40 shadow-sm">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">
                    NVIDIA settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 px-4 text-sm sm:px-6 sm:text-base">
                  <div>
                    <p className="mb-2 font-semibold text-foreground">
                      Required settings
                    </p>
                    <DocBulletList>
                      <DocBulletItem>
                        Background Max Frame Rate — same as Max Frame Rate
                      </DocBulletItem>
                      <DocBulletItem>Max Frame Rate — up to 98</DocBulletItem>
                      <DocBulletItem>Vertical Sync — Off</DocBulletItem>
                    </DocBulletList>
                  </div>
                  <div>
                    <p className="mb-2 font-semibold text-foreground">
                      Quality settings
                    </p>
                    <DocBulletList>
                      <DocBulletItem>Anisotropic Filtering — 16x</DocBulletItem>
                      <DocBulletItem>
                        Antialiasing Mode — Enhance application setting
                      </DocBulletItem>
                      <DocBulletItem>Antialiasing Setting — 8x</DocBulletItem>
                      <DocBulletItem>
                        Antialiasing Transparency — 8x supersample
                      </DocBulletItem>
                    </DocBulletList>
                  </div>
                </CardContent>
              </Card>
            </div>
          </DocSection>

          <DocSection id="controller" eyebrow="Input" title="Controller setup">
            <Card className="border-border/60 bg-card/40 shadow-sm">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Controller configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 px-4 text-sm sm:px-6 sm:text-base">
                <div>
                  <p className="mb-2 font-semibold text-foreground">
                    Xbox controllers
                  </p>
                  <DocBulletList>
                    <DocBulletItem>Natively supported</DocBulletItem>
                    <DocBulletItem>Must be enabled in main menu settings</DocBulletItem>
                  </DocBulletList>
                </div>
                <div>
                  <p className="mb-2 font-semibold text-foreground">
                    PlayStation controllers
                  </p>
                  <ol className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        1
                      </span>
                      <span className="text-muted-foreground">
                        Add Shadowrun as Non-Steam Game
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        2
                      </span>
                      <span className="text-muted-foreground">
                        Enable PlayStation Controller Support in Steam
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                        3
                      </span>
                      <span className="text-muted-foreground">
                        Connect controller via USB or Bluetooth
                      </span>
                    </li>
                  </ol>
                </div>
                <DocCallout variant="warning" title="Main menu only">
                  <DocBulletList>
                    <DocBulletItem>
                      Controller settings can only be changed from the main menu
                    </DocBulletItem>
                    <DocBulletItem>
                      You cannot switch input methods during a match
                    </DocBulletItem>
                  </DocBulletList>
                </DocCallout>
              </CardContent>
            </Card>
          </DocSection>

          <DocSection id="getting-game" eyebrow="Platforms" title="Getting the game">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="border-border/60 bg-card/40 shadow-sm">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">PC version</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 px-4 text-sm sm:px-6 sm:text-base">
                  <p className="text-muted-foreground">
                    Follow our{" "}
                    <Link
                      href="/docs/install"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      installation guide
                    </Link>{" "}
                    for PC setup.
                  </p>
                  <DocBulletList>
                    <DocBulletItem>No Xbox Live Gold membership required</DocBulletItem>
                    <DocBulletItem>
                      Only needs key activation and Xbox.com account
                    </DocBulletItem>
                  </DocBulletList>
                </CardContent>
              </Card>
              <Card className="border-border/60 bg-card/40 shadow-sm">
                <CardHeader className="px-4 sm:px-6">
                  <CardTitle className="text-lg sm:text-xl">Xbox version</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5 px-4 text-sm sm:px-6 sm:text-base">
                  <a
                    href="https://www.xbox.com/en-US/games/store/shadowrun/bsnjbk3gbdt3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-2 block font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Available on Xbox Store ($14.99)
                  </a>
                  <DocBulletList>
                    <DocBulletItem>
                      Xbox Live Gold required for public matchmaking
                    </DocBulletItem>
                    <DocBulletItem>
                      Private matches may be accessible without Gold
                    </DocBulletItem>
                  </DocBulletList>
                  <p className="pt-1 font-medium text-primary">
                    Game is most active in private lobbies
                  </p>
                </CardContent>
              </Card>
            </div>
          </DocSection>

          <DocSection
            id="connection"
            eyebrow="Network"
            title="Connection issues"
          >
            <Card className="border-border/60 bg-card/40 shadow-sm">
              <CardContent className="space-y-5 px-4 pt-5 text-sm sm:px-6 sm:pt-6 sm:text-base">
                <div>
                  <p className="mb-2 font-semibold text-foreground">
                    Basic troubleshooting
                  </p>
                  <DocBulletList>
                    <DocBulletItem>
                      Enable open NAT or UPnP in router settings
                    </DocBulletItem>
                    <DocBulletItem>
                      Verify open NAT status in Xbox Console Companion App
                    </DocBulletItem>
                    <DocBulletItem>Check for PCID registry conflicts</DocBulletItem>
                    <DocBulletItem>
                      Contact ISP about Carrier Grade NAT (CGNAT)
                    </DocBulletItem>
                  </DocBulletList>
                </div>
                <DocCallout variant="warning" title="Registry fix (PCID / GFWL)">
                  <ol className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          1
                        </span>
                        <span className="break-words text-muted-foreground">
                          Uninstall GFWL components
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          2
                        </span>
                        <span className="break-words text-muted-foreground">
                          Open regedit as administrator
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          3
                        </span>
                        <span className="min-w-0 flex-1 text-muted-foreground">
                          Navigate to{" "}
                          <code className="break-all rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                            C:\Users\USERNAME\AppData\Local\Microsoft\Xlive
                          </code>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          4
                        </span>
                        <span className="break-words text-muted-foreground">
                          Delete the entire folder
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                          5
                        </span>
                        <span className="break-words text-muted-foreground">
                          Reinstall GFWL
                        </span>
                      </li>
                    </ol>
                  </DocCallout>
              </CardContent>
            </Card>
          </DocSection>

          <DocSection eyebrow="Continue" title="What's next?">
            <p className="text-sm text-muted-foreground sm:text-base">
              If you are set up and stable, use these shortcuts to finish tuning
              or get into matches.
            </p>
            <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
              <Link
                href="/docs/install"
                className="group flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
              >
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="font-semibold leading-snug text-foreground underline-offset-4 decoration-transparent transition-[color,text-decoration-color] group-hover:text-primary group-hover:underline group-hover:decoration-primary/60">
                    Review install steps
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    Downloads, GFWL, matchmaking preferences, and requirements
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
              <Link
                href="/docs/troubleshoot#performance"
                className="group flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
              >
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="flex items-center gap-2 font-semibold leading-snug text-foreground underline-offset-4 decoration-transparent transition-[color,text-decoration-color] group-hover:text-primary group-hover:underline group-hover:decoration-primary/60">
                    <Gauge className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
                    Performance settings
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    FPS limits, dxvk.conf, and NVIDIA control panel
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
              {ENABLE_DOWNLOAD_PAGE ? (
                <Link
                  href="/download"
                  className="group flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
                >
                  <div className="min-w-0 flex-1 text-left">
                    <h3 className="flex items-center gap-2 font-semibold leading-snug text-foreground underline-offset-4 decoration-transparent transition-[color,text-decoration-color] group-hover:text-primary group-hover:underline group-hover:decoration-primary/60">
                      <Download className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
                      Launcher install
                    </h3>
                    <p className="mt-1 text-sm leading-snug text-muted-foreground">
                      Get the community launcher and latest build
                    </p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    aria-hidden
                  />
                </Link>
              ) : null}
            </div>
          </DocSection>

          <TroubleshootDiscordCta
            title="Still having issues?"
            description="If you’ve tried everything above, our Discord has experienced players who can help with your specific setup."
            buttonLabel="Get help on Discord"
          />
        </div>
      </article>
    </DocLayout>
  );
}
