import { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Download } from "lucide-react";
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
import { FAQsSection } from "./faqs-section";
import clientPromise from "@/lib/mongodb";

export const metadata: Metadata = {
  title: "Troubleshooting Shadowrun FPS | Common Errors & Fixes",
  description:
    "Fix Shadowrun FPS (2007) on PC: Games for Windows Live activation, key errors, FPS caps, NAT, controllers, and crashes. Community-tested fixes for legacy GFWL and preserved multiplayer.",
  alternates: {
    canonical: "/troubleshoot",
  },
  keywords: [
    "Shadowrun FPS troubleshooting",
    "Shadowrun GFWL activation",
    "Games for Windows Live errors",
    "GFWL key activation Shadowrun",
    "Games for Windows LIVE Shadowrun",
    "Shadowrun FPS errors",
    "Shadowrun PC performance",
    "Shadowrun NAT strict",
    "Shadowrun controller not working",
    "legacy PC game fixes",
    "game preservation support",
    "Shadowrun multiplayer connection",
    "Shadowrun frame rate cap",
    "Shadowrun xlive",
    "dead game multiplayer fix",
  ],
  openGraph: {
    title: "Troubleshooting Shadowrun FPS | Common Errors & Fixes",
    description:
      "GFWL activation, networking, performance, and controller fixes for Shadowrun FPS — plus community support for this preserved classic.",
    url: "https://www.shadowrunfps.com/troubleshoot",
    siteName: "Shadowrun FPS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.shadowrunfps.com/hero.webp",
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
      "GFWL, NAT, FPS, and crash fixes for Shadowrun FPS on PC — community preservation guide.",
    images: [
      {
        url: "https://www.shadowrunfps.com/hero.webp",
        width: 1200,
        height: 630,
        alt: "Troubleshooting Shadowrun FPS",
      },
    ],
  },
};

async function getFaqsForSchema(): Promise<{ title: string; content: string }[]> {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const faqs = await db
      .collection("FAQs")
      .find({ category: "errors" })
      .sort({ order: 1 })
      .limit(20)
      .project({ title: 1, content: 1 })
      .toArray();
    return faqs as unknown as { title: string; content: string }[];
  } catch {
    return [];
  }
}

export default async function TroubleshootPage() {
  const faqs = await getFaqsForSchema();

  const faqSchema =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.title,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.content || faq.title,
            },
          })),
        }
      : null;

  return (
    <>
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
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
                    PlayStation and other controllers
                  </p>
                  <p className="mb-3 text-muted-foreground">
                    Any non-Xbox gamepad uses the steps below — Xbox controllers are
                    native once enabled in the main menu (Switch Pro, generic PC
                    pads, etc. follow the same workflow as PlayStation).
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
                    Install from the{" "}
                    <Link
                      href="/download"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      download page
                    </Link>
                    .
                  </p>
                  <DocBulletList>
                    <DocBulletItem>
                      Download the launcher and run the installer
                    </DocBulletItem>
                    <DocBulletItem>
                      Open the launcher and sign in with Discord
                    </DocBulletItem>
                    <DocBulletItem>
                      Follow the setup prompts, then click Play
                    </DocBulletItem>
                    <DocBulletItem>
                      Discord server membership is required
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
              If you still need the game, start with the launcher.
            </p>
            <div className="grid max-w-xl gap-3">
              <Link
                href="/download"
                className="group flex min-h-[4.5rem] items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4 shadow-sm transition-colors hover:border-primary/30 hover:bg-muted/18 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:p-5"
              >
                <div className="min-w-0 flex-1 text-left">
                  <h3 className="flex items-center gap-2 font-semibold leading-snug text-foreground underline-offset-4 decoration-transparent transition-[color,text-decoration-color] group-hover:text-primary group-hover:underline group-hover:decoration-primary/60">
                    <Download className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
                    Download launcher
                  </h3>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    Install the launcher, sign in with Discord, then click Play
                  </p>
                </div>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              </Link>
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
    </>
  );
}
