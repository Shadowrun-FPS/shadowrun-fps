import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { FAQsSection } from "./faqs-section";

export const metadata: Metadata = {
  title: "Troubleshooting",
  description:
    "Find solutions to common issues and troubleshooting tips for Shadowrun FPS, including errors, activation issues, and performance tips.",
  openGraph: {
    title: "Troubleshooting",
    description:
      "Find solutions to common issues and troubleshooting tips for Shadowrun FPS, including errors, activation issues, and performance tips. Join the Shadowrun community for more tips.",
    url: "https://ShadowrunFPS.com/docs/troubleshooting",
    images: [
      {
        url: "https://ShadowrunFPS.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Troubleshooting Shadowrun FPS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Troubleshooting",
    description:
      "Find solutions to common issues and troubleshooting tips for Shadowrun FPS, including errors, activation issues, and performance tips. Join the Shadowrun community for more tips.",
    images: [
      {
        url: "https://ShadowrunFPS.com/shadowrun_invite_banner.png",
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
      <article className="space-y-6 sm:space-y-8">
        <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4 sm:p-6">
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Having a specific error?</span> Check the{" "}
            <a href="#errors" className="text-primary hover:underline font-medium">
              Common Errors
            </a>{" "}
            section below for quick solutions. Need general setup help? See the sections below for activation, performance, controller setup, and connection troubleshooting.
          </p>
        </div>

        <FAQsSection />

        <section id="activation" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Activation Issues
          </h2>
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="font-medium text-foreground">Important Note:</p>
                  <p>
                    First-time activation may take up to 20 minutes to load the
                    key entry page after logging in.
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">
                    If you get &quot;This key has been used too many
                    times&quot;:
                  </p>
                  <ol className="space-y-2 list-decimal list-inside">
                    <li>Click &apos;Retry&apos;</li>
                    <li>Wait 5-10 minutes for the key entry window</li>
                    <li>
                      If it appears frozen:
                      <ul className="mt-1 ml-6 list-disc">
                        <li>Use Win-Key + Tab</li>
                        <li>Drag Shadowrun to a second desktop</li>
                        <li>Open Task Manager to end the process if needed</li>
                      </ul>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="performance" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Performance Settings
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">FPS Limitations</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="font-medium text-foreground">Important:</p>
                    <p>
                      Parts of the game malfunction when FPS is not limited:
                    </p>
                    <ul className="mt-2 ml-4 list-disc">
                      <li>Firing rate of guns (minigun/smg)</li>
                      <li>In-game physics (gusting/jumping)</li>
                      <li>
                        Gust grenades only work if Server host is at 50fps or
                        under
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium">
                      Recommended FPS Limit: 50-98 fps
                    </p>
                    <p className="mt-2">Set this in dxvk.conf:</p>
                    <pre className="p-2 mt-2 rounded bg-muted">
                      dxgi.maxFrameRate = 85{"\n"}
                      d3d9.maxFrameRate = 85
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">NVIDIA Settings</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
                  <p>Required Settings:</p>
                  <ul className="space-y-2">
                    <li>Background Max Frame Rate - same as Max Frame Rate</li>
                    <li>Max Frame Rate - up to 98</li>
                    <li>Vertical Sync - Off</li>
                  </ul>
                  <p className="mt-4">Quality Settings:</p>
                  <ul className="space-y-2">
                    <li>Anisotropic Filtering - 16x</li>
                    <li>Antialiasing Mode - Enhance application setting</li>
                    <li>Antialiasing Setting - 8x</li>
                    <li>Antialiasing Transparency - 8x supersample</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <section id="controller" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Controller Setup
          </h2>
          <Card>
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="text-lg sm:text-xl">Controller Configuration</CardTitle>
            </CardHeader>
            <CardContent className="px-4 sm:px-6">
              <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
                <div>
                  <p className="font-medium">Xbox Controllers:</p>
                  <ul className="pl-4 mt-2 space-y-2 list-disc">
                    <li>Natively supported</li>
                    <li>Must be enabled in main menu settings</li>
                  </ul>
                </div>
                <div>
                  <p className="font-medium">PlayStation Controllers:</p>
                  <ol className="mt-2 space-y-2 list-decimal list-inside">
                    <li>Add Shadowrun as Non-Steam Game</li>
                    <li>Enable PlayStation Controller Support in Steam</li>
                    <li>Connect controller via USB or Bluetooth</li>
                  </ol>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="font-medium text-foreground">Important:</p>
                  <ul className="mt-2 space-y-2">
                    <li>
                      Controller settings can ONLY be changed from the main menu
                    </li>
                    <li>Cannot switch input methods during a match</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="getting-game" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Getting the Game
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">PC Version</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  <p>
                    Follow our{" "}
                    <Link
                      href="/docs/install"
                      className="text-primary hover:underline"
                    >
                      installation guide
                    </Link>{" "}
                    for PC setup
                  </p>
                  <p>No Xbox Live Gold membership required</p>
                  <p>Only needs key activation and Xbox.com account</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Xbox Version</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-2 text-sm sm:text-base text-muted-foreground">
                  <a
                    href="https://www.xbox.com/en-US/games/store/shadowrun/bsnjbk3gbdt3"
                    className="block mb-2 text-primary hover:underline"
                  >
                    Available on Xbox Store ($14.99)
                  </a>
                  <p>Xbox Live Gold required for public matchmaking</p>
                  <p>Private matches may be accessible without Gold</p>
                  <p className="text-primary">
                    Game is most active in private lobbies
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="connection" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Connection Issues
          </h2>
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="space-y-4 text-sm sm:text-base text-muted-foreground">
                <div>
                  <p className="font-medium">Basic Troubleshooting:</p>
                  <ul className="pl-4 mt-2 space-y-2 list-disc">
                    <li>Enable open NAT or UPnP in router settings</li>
                    <li>
                      Verify open NAT status in Xbox Console Companion App
                    </li>
                    <li>Check for PCID registry conflicts</li>
                    <li>Contact ISP about Carrier Grade NAT (CGNAT)</li>
                  </ul>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="font-medium">Registry Fix:</p>
                  <ol className="mt-2 space-y-1 list-decimal list-inside">
                    <li className="break-words">Uninstall GFWL components</li>
                    <li className="break-words">
                      Open regedit as administrator
                    </li>
                    <li className="break-words">
                      Navigate to
                      C:\Users\USERNAME\AppData\Local\Microsoft\Xlive
                    </li>
                    <li className="break-words">Delete the entire folder</li>
                    <li className="break-words">Reinstall GFWL</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </article>
    </DocLayout>
  );
}

