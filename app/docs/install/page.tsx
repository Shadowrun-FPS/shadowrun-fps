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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

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
      <article className="space-y-8">
        <section className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Install Shadowrun FPS (2007)
          </h1>
          <p className="text-xl text-muted-foreground">
            Complete installation guide for setting up Shadowrun FPS on your PC.
            Follow these steps carefully to ensure a smooth installation
            process.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/docs/troubleshoot"
              className="inline-flex items-center gap-2 text-primary hover:underline"
            >
              Troubleshooting Guide
            </Link>
          </div>
        </section>

        <section id="getting-started" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">Required Tools</h2>
          <div className="grid gap-3 sm:gap-4">
            <Card>
              <CardHeader className="px-3 sm:px-6">
                <CardTitle>Essential Downloads</CardTitle>
              </CardHeader>
              <CardContent className="px-3 pt-2 sm:px-6">
                <div className="grid gap-6 sm:grid-cols-3">
                  <div>
                    <h3 className="mb-2 underline text-medium">
                      File Archiver
                    </h3>
                    <a
                      href="https://www.7-zip.org/a/7z2201-x64.exe"
                      className="text-primary hover:underline"
                    >
                      7-Zip
                    </a>
                    <p className="mt-1 font-medium text-muted-foreground">
                      Required for extracting game files.
                    </p>
                    <p className="mt-1 font-medium text-muted-foreground">
                      Note: WinRAR is not recommended.
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-medium underline">Game Service</h3>
                    <a
                      href="https://community.pcgamingwiki.com/files/file/1012-microsoft-games-for-windows-live/"
                      className="text-primary hover:underline"
                    >
                      Games for Windows Live
                    </a>
                    <p className="mt-1 font-medium text-muted-foreground">
                      Required for game activation and online play
                    </p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-medium underline">Game Files</h3>
                    <a
                      href="https://mega.nz/file/5LdjgJQY#XMIClDPN0j0p7FrjNTGL3518OU3nrJl-xCA5W5jZZcg"
                      className="text-primary hover:underline"
                    >
                      Shadowrun DXVK (2.3)
                    </a>
                    <p className="mt-1 font-medium text-muted-foreground">
                      Pre-installed and updated game package
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="installation-steps" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Installation Steps
          </h2>
          <Card>
            <CardContent className="pt-6">
              <ol className="space-y-6">
                <li>
                  <h3 className="mb-2 text-lg font-medium">
                    1. Install{" "}
                    <a
                      href="https://community.pcgamingwiki.com/files/file/1012-microsoft-games-for-windows-live/"
                      className="text-primary hover:underline"
                    >
                      Games For Windows Live
                    </a>
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>Extract the GFWL folder</li>
                    <li>Run &quot;gfwllivesetup.exe&quot; as administrator.</li>
                    <ul>
                      Note: The &quot;Connection Error&quot; after install is
                      normal and can be ignored.
                    </ul>
                    <li>
                      You don&apos;t need to launch GFWL program after
                      installing.
                    </li>
                  </ul>
                </li>
                <li>
                  <h3 className="mb-2 text-lg font-medium">
                    2. Install{" "}
                    <a
                      href="https://mega.nz/file/5LdjgJQY#XMIClDPN0j0p7FrjNTGL3518OU3nrJl-xCA5W5jZZcg"
                      className="text-primary hover:underline"
                    >
                      Shadowrun DXVK
                    </a>
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      Extract &quot;Shadowrun DXVK (2.3).zip&quot; using 7-Zip.
                    </li>
                    <li>
                      Drag and drop or extract the Shadowrun folder to your
                      desired location.
                      <ul>
                        Create shortcut of Shadowrun.exe if you want a desktop
                        shortcut.
                      </ul>
                    </li>
                    <li>
                      Install any required DirectX components, if prompted.
                    </li>
                  </ul>
                </li>
                <li>
                  <h3 className="mb-2 text-lg font-medium">3. First Launch</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>Double click the Shadowrun.exe to launch the game.</li>
                    <li>
                      Configure Windows compatibility settings by clicking
                      &apos;Run&apos;, if prompted.
                    </li>
                    <li>Press Home (or Fn+Home) to open the GFWL overlay.</li>
                    <li>
                      Click &quot;Use existing LIVE profile&quot; to sign in to
                      your Microsoft account.
                    </li>
                    <li>Enter your key when prompted.</li>
                    <div className="p-3 rounded-lg bg-muted">
                      <p className="font-medium text-foreground">
                        Important Note: First-time activation may take up to 20
                        minutes to activate after the key entry page.
                      </p>
                    </div>
                  </ul>
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        <section id="post-install" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Post-Installation Tips
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4 text-lg font-medium text-muted-foreground">
                <ul className="space-y-2">
                  <li>
                    Configure graphics settings for your system. The game&apos;s
                    resolution will likely not match your screen on first load.
                  </li>
                  <li>
                    Set up your controls and key bindings thru the main menu.
                    Settings -{">"} Gamepad
                  </li>

                  <li>
                    Join the community{" "}
                    <a
                      href="discord://discord.com/servers/this-is-shadowrun-930362820627943495"
                      className="text-primary hover:underline"
                    >
                      Discord
                    </a>{" "}
                    for support.
                  </li>
                </ul>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="font-medium">Important Note:</p>
                  <p>
                    Make sure to configure your FPS limits and graphics settings
                    before playing online matches. See our{" "}
                    <Link
                      href="/docs/troubleshoot#performance"
                      className="text-primary hover:underline"
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

        <section id="game-key" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Obtaining a Game Key
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <a
                      href="https://store.steampowered.com/app/15620/Warhammer_40000_Dawn_of_War_II/"
                      className="block transition-opacity hover:opacity-90"
                    >
                      <Image
                        src="/dawnofwar2.jpg"
                        alt="Dawn of War II"
                        width={400}
                        height={300}
                        className="object-cover rounded-lg"
                      />
                      <p className="mt-2 font-lg text-bold">
                        Warhammer 40,000: Dawn of War II
                      </p>
                    </a>
                    <a
                      href="https://store.steampowered.com/app/10460/The_Club/"
                      className="block transition-opacity hover:opacity-90"
                    >
                      <Image
                        src="/TheClub.jpg"
                        alt="The Club"
                        width={400}
                        height={300}
                        className="object-cover rounded-lg"
                      />

                      <p className="mt-2 font-lg text-bold">The Club</p>
                    </a>
                  </div>

                  {/* Key Information Below */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Key Information</h3>
                    <div className="grid gap-4">
                      <div>
                        <h4 className="mb-2 font-medium">Getting Your Key:</h4>
                        <ol className="space-y-2 list-decimal list-inside">
                          <li>Purchase any compatible game on Steam</li>
                          <li>Right-click the game in your library</li>
                          <li>Select Manage → CD Keys</li>
                          <li>Copy the Legacy GFWL key</li>
                        </ol>
                      </div>
                      <div className="p-3 rounded-lg bg-muted">
                        <p className="font-medium">Key Usage:</p>
                        <ul className="mt-2 space-y-1">
                          <li>Each key can be used up to 10 times.</li>
                          <li>Keys can be shared until depleted.</li>
                          <li>
                            Keys are tied to your PCID. Changing PC hardware may
                            require re-activation.
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

        <section id="matchmaking" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Matchmaking Preferences
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4 text-medium text-muted-foreground">
                <p>Please update your in-game matchmaking preferences:</p>
                <ul className="ml-4 space-y-2 list-disc">
                  <li>
                    Deselect &apos;8&apos; and &apos;12&apos; player options
                  </li>
                  <li>Deselect small map variations</li>
                </ul>

                <div className="p-3 rounded-lg bg-muted">
                  <p>
                    These default preferences can limit lobby size
                    automatically, preventing 16-player matches.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="requirements" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            System Requirements
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Minimum Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-medium text-muted-foreground">
                  <li>Windows 7 or later</li>
                  <li>2GB RAM</li>
                  <li>DirectX 9.0c</li>
                  <li>10GB available space</li>
                  <li>Internet connection for multiplayer</li>
                  <li>Microsoft account</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recommended</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-medium text-muted-foreground">
                  <li>Windows 10/11</li>
                  <li>4GB RAM</li>
                  <li>DirectX 11</li>
                  <li>15GB available space</li>
                  <li>Stable internet connection</li>
                  <li>
                    Open NAT. See{" "}
                    <a
                      href="https://support.xbox.com/en-US/help/hardware-network/connect-network/xbox-one-nat-error"
                      className="text-primary hover:underline"
                    >
                      here
                    </a>{" "}
                    for more info.
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      </article>
    </DocLayout>
  );
}
