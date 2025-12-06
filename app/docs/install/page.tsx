import Link from "next/link";
import Image from "next/image";
import React from "react";
import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import LauncherRecommendation from "@/components/launcher-recommendation";

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
      <article className="space-y-6 sm:space-y-8">
        <section className="space-y-3 sm:space-y-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Install Shadowrun FPS (2007)
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Complete installation guide for setting up Shadowrun FPS on your PC.
            Follow these steps carefully to ensure a smooth installation
            process.
          </p>

          {/* Launcher Recommendation Alert */}
          <LauncherRecommendation />

          <div className="flex flex-wrap gap-3 sm:gap-4">
            <Link
              href="/docs/troubleshoot"
              className="inline-flex gap-2 items-center text-sm sm:text-base text-primary hover:underline touch-manipulation min-h-[44px] sm:min-h-0"
            >
              Troubleshooting Guide
            </Link>
          </div>
        </section>

        <section id="getting-started" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Required Tools
          </h2>
          <div className="grid gap-3 sm:gap-4">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Essential Downloads
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pt-3 sm:px-6 sm:pt-4">
                <div className="grid gap-4 sm:gap-6 sm:grid-cols-1 lg:grid-cols-3">
                  <div className="flex flex-col p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                        1
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold">
                        File Archiver
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 flex-grow">
                      Required for extracting game files. WinRAR is not recommended.
                    </p>
                    <a
                      href="https://www.7-zip.org/a/7z2201-x64.exe"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors bg-primary hover:bg-primary/90 text-primary-foreground mt-auto"
                    >
                      Download 7-Zip
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div className="flex flex-col p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                        2
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold">
                        Game Service
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 flex-grow">
                      Required for game activation and online play
                    </p>
                    <a
                      href="https://community.pcgamingwiki.com/files/file/1012-microsoft-games-for-windows-live/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors bg-primary hover:bg-primary/90 text-primary-foreground mt-auto"
                    >
                      Download GFWL
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                  <div className="flex flex-col p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex items-center justify-center w-6 h-6 text-xs font-bold rounded-full bg-primary text-primary-foreground">
                        3
                      </span>
                      <h3 className="text-base sm:text-lg font-semibold">
                        Game Files
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 flex-grow">
                      Pre-installed and updated game package
                    </p>
                    <a
                      href="https://mega.nz/file/5LdjgJQY#XMIClDPN0j0p7FrjNTGL3518OU3nrJl-xCA5W5jZZcg"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors bg-primary hover:bg-primary/90 text-primary-foreground mt-auto"
                    >
                      Download Shadowrun DXVK (2.3)
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="installation-steps" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Installation Steps
          </h2>
          <Card>
            <CardContent className="px-4 pt-4 sm:pt-6 sm:px-6">
              <ol className="space-y-6 sm:space-y-8">
                <li className="relative pl-8 sm:pl-10">
                  <div className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 text-sm font-bold rounded-full bg-primary text-primary-foreground">
                    1
                  </div>
                  <h3 className="mb-3 text-lg font-semibold">
                    Install{" "}
                    <a
                      href="https://community.pcgamingwiki.com/files/file/1012-microsoft-games-for-windows-live/"
                      className="text-primary hover:underline"
                    >
                      Games For Windows Live
                    </a>
                  </h3>
                  <ul className="space-y-2.5 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Extract the GFWL folder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Run &quot;gfwllivesetup.exe&quot; as administrator.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>
                        <strong className="text-foreground">Note:</strong> The &quot;Connection Error&quot; after install is
                        normal and can be ignored.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>You don&apos;t need to launch GFWL program after installing.</span>
                    </li>
                  </ul>
                </li>
                <li className="relative pl-8 sm:pl-10">
                  <div className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 text-sm font-bold rounded-full bg-primary text-primary-foreground">
                    2
                  </div>
                  <h3 className="mb-3 text-lg font-semibold">
                    Install{" "}
                    <a
                      href="https://mega.nz/file/5LdjgJQY#XMIClDPN0j0p7FrjNTGL3518OU3nrJl-xCA5W5jZZcg"
                      className="text-primary hover:underline"
                    >
                      Shadowrun DXVK
                    </a>
                  </h3>
                  <ul className="space-y-2.5 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Extract &quot;Shadowrun DXVK (2.3).zip&quot; using 7-Zip.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Drag and drop or extract the Shadowrun folder to your desired location.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Create shortcut of Shadowrun.exe if you want a desktop shortcut.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Install any required DirectX components, if prompted.</span>
                    </li>
                  </ul>
                </li>
                <li className="relative pl-8 sm:pl-10">
                  <div className="absolute left-0 top-0 flex items-center justify-center w-6 h-6 text-sm font-bold rounded-full bg-primary text-primary-foreground">
                    3
                  </div>
                  <h3 className="mb-3 text-lg font-semibold">First Launch</h3>
                  <ul className="space-y-2.5 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Double click the Shadowrun.exe to launch the game.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Configure Windows compatibility settings by clicking &apos;Run&apos;, if prompted.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Press Home (or Fn+Home) to open the GFWL overlay.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Click &quot;Use existing LIVE profile&quot; to sign in to your Microsoft account.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span>Enter your key when prompted.</span>
                    </li>
                    <div className="mt-4 p-4 rounded-lg border-l-4 border-primary/50 bg-primary/5">
                      <p className="font-semibold text-foreground mb-1">
                        ⚠️ Important Note
                      </p>
                      <p className="text-sm text-muted-foreground">
                        First-time activation may take up to 20 minutes to activate after the key entry page.
                      </p>
                    </div>
                  </ul>
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        <section id="post-install" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Post-Installation Tips
          </h2>
          <Card>
            <CardContent className="px-4 pt-4 sm:pt-6 sm:px-6">
              <div className="space-y-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>
                      Configure graphics settings for your system. The game&apos;s
                      resolution will likely not match your screen on first load.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>
                      Set up your controls and key bindings through the main menu.
                      Settings -{">"} Gamepad
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>
                      Join the community{" "}
                      <a
                        href="discord://discord.com/servers/this-is-shadowrun-930362820627943495"
                        className="text-primary hover:underline font-medium"
                      >
                        Discord
                      </a>{" "}
                      for support.
                    </span>
                  </li>
                </ul>
                <div className="p-4 rounded-lg border-l-4 border-primary/50 bg-primary/5">
                  <p className="font-semibold text-foreground mb-1">
                    ⚠️ Important Note
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Make sure to configure your FPS limits and graphics settings
                    before playing online matches. See our{" "}
                    <Link
                      href="/docs/troubleshoot#performance"
                      className="text-primary hover:underline font-medium"
                    >
                      performance guide
                    </Link>{" "}
                    for detailed settings.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="game-key" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Obtaining a Game Key
          </h2>
          <Card>
            <CardContent className="px-4 pt-4 sm:pt-6 sm:px-6">
              <div className="space-y-4 sm:space-y-6">
                <div className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
                    <a
                      href="https://store.steampowered.com/app/15620/Warhammer_40000_Dawn_of_War_II/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block transition-all hover:scale-[1.02]"
                    >
                      <div className="overflow-hidden rounded-lg border border-border/50 bg-muted/30 group-hover:border-primary/50 transition-colors">
                        <Image
                          src="/dawnofwar2.jpg"
                          alt="Dawn of War II"
                          width={400}
                          height={300}
                          className="object-cover w-full h-auto transition-transform group-hover:scale-105"
                        />
                        <div className="p-3">
                          <p className="text-base font-semibold sm:text-lg group-hover:text-primary transition-colors">
                            Warhammer 40,000: Dawn of War II
                          </p>
                        </div>
                      </div>
                    </a>
                    <a
                      href="https://store.steampowered.com/app/10460/The_Club/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group block transition-all hover:scale-[1.02]"
                    >
                      <div className="overflow-hidden rounded-lg border border-border/50 bg-muted/30 group-hover:border-primary/50 transition-colors">
                        <Image
                          src="/TheClub.jpg"
                          alt="The Club"
                          width={400}
                          height={300}
                          className="object-cover w-full h-auto transition-transform group-hover:scale-105"
                        />
                        <div className="p-3">
                          <p className="text-base font-semibold sm:text-lg group-hover:text-primary transition-colors">
                            The Club
                          </p>
                        </div>
                      </div>
                    </a>
                  </div>

                  {/* Key Information Below */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Key Information</h3>
                    <div className="grid gap-4">
                      <div>
                        <h4 className="mb-3 font-semibold text-foreground">Getting Your Key:</h4>
                        <ol className="space-y-2.5">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                              1
                            </span>
                            <span className="text-muted-foreground">Purchase any compatible game on Steam</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                              2
                            </span>
                            <span className="text-muted-foreground">Right-click the game in your library</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                              3
                            </span>
                            <span className="text-muted-foreground">Select Manage → CD Keys</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                              4
                            </span>
                            <span className="text-muted-foreground">Copy the Legacy GFWL key</span>
                          </li>
                        </ol>
                      </div>
                      <div className="p-4 rounded-lg border-l-4 border-primary/50 bg-primary/5">
                        <p className="font-semibold text-foreground mb-2">Key Usage:</p>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                            <span>Each key can be used up to 10 times.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                            <span>Keys can be shared until depleted.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                            <span>
                              Keys are tied to your PCID. Changing PC hardware may
                              require re-activation.
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="matchmaking" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            Matchmaking Preferences
          </h2>
          <Card>
            <CardContent className="px-4 pt-4 sm:pt-6 sm:px-6">
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-foreground font-medium">
                  Please update your in-game matchmaking preferences:
                </p>
                <ul className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Deselect &apos;8&apos; and &apos;12&apos; player options</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Deselect small map variations</span>
                  </li>
                </ul>

                <div className="p-4 rounded-lg border-l-4 border-primary/50 bg-primary/5">
                  <p className="text-sm text-muted-foreground">
                    These default preferences can limit lobby size
                    automatically, preventing 16-player matches.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="requirements" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            System Requirements
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Minimum Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <ul className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Windows 7 or later</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>2GB RAM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>DirectX 9.0c</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>10GB available space</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Internet connection for multiplayer</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Microsoft account</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">
                  Recommended
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <ul className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Windows 10/11</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>4GB RAM</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>DirectX 11</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>15GB available space</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Stable internet connection</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>
                      Open NAT. See{" "}
                      <a
                        href="https://support.xbox.com/en-US/help/hardware-network/connect-network/xbox-one-nat-error"
                        className="text-primary hover:underline font-medium"
                      >
                        here
                      </a>{" "}
                      for more info.
                    </span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Next Steps Section */}
        <section className="space-y-3 sm:space-y-4">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
            What&apos;s Next?
          </h2>
          <Card>
            <CardContent className="px-4 pt-4 sm:pt-6 sm:px-6">
              <div className="space-y-4">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Now that you&apos;ve installed Shadowrun FPS, here are some recommended next steps:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Link
                    href="/docs/troubleshoot#performance"
                    className="group p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all"
                  >
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      Configure Performance
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Set up FPS limits and graphics settings for optimal gameplay
                    </p>
                  </Link>
                  <a
                    href="discord://discord.com/servers/this-is-shadowrun-930362820627943495"
                    className="group p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all"
                  >
                    <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                      Join the Community
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Connect with other players, find matches, and get support
                    </p>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </article>
    </DocLayout>
  );
}
