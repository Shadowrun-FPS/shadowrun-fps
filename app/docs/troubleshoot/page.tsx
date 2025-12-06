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

        {/* Still Need Help Section */}
        <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
            Still Need Help?
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-3">
            Can&apos;t find a solution here? Our community is ready to help!
          </p>
          <a
            href="discord://discord.com/servers/this-is-shadowrun-930362820627943495"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-medium rounded-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Join Discord Community
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <FAQsSection />

        <section id="activation" className="space-y-3 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            Activation Issues
          </h2>
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
              <div className="space-y-4 text-sm sm:text-base">
                <div className="p-4 rounded-lg border-l-4 border-primary/50 bg-primary/5">
                  <p className="font-semibold text-foreground mb-1">
                    ⚠️ Important Note
                  </p>
                  <p className="text-sm text-muted-foreground">
                    First-time activation may take up to 20 minutes to load the
                    key entry page after logging in.
                  </p>
                </div>
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">
                    If you get &quot;This key has been used too many
                    times&quot;:
                  </p>
                  <ol className="space-y-2.5">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        1
                      </span>
                      <span className="text-muted-foreground">Click &apos;Retry&apos;</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        2
                      </span>
                      <span className="text-muted-foreground">Wait 5-10 minutes for the key entry window</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        3
                      </span>
                      <div className="flex-1">
                        <span className="text-muted-foreground">If it appears frozen:</span>
                        <ul className="mt-2 ml-4 space-y-1.5">
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                            <span className="text-muted-foreground">Use Win-Key + Tab</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                            <span className="text-muted-foreground">Drag Shadowrun to a second desktop</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                            <span className="text-muted-foreground">Open Task Manager to end the process if needed</span>
                          </li>
                        </ul>
                      </div>
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
                <div className="space-y-4 text-sm sm:text-base">
                  <div className="p-4 rounded-lg border-l-4 border-primary/50 bg-primary/5">
                    <p className="font-semibold text-foreground mb-2">
                      ⚠️ Important
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">
                      Parts of the game malfunction when FPS is not limited:
                    </p>
                    <ul className="space-y-1.5">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">Firing rate of guns (minigun/smg)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">In-game physics (gusting/jumping)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          Gust grenades only work if Server host is at 50fps or under
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-2">
                      Recommended FPS Limit: 50-98 fps
                    </p>
                    <p className="text-sm text-muted-foreground mb-2">Set this in dxvk.conf:</p>
                    <pre className="p-3 mt-2 rounded-lg bg-muted border border-border/50 font-mono text-xs sm:text-sm overflow-x-auto">
                      <code>dxgi.maxFrameRate = 85{`\n`}d3d9.maxFrameRate = 85</code>
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
                <div className="space-y-4 text-sm sm:text-base">
                  <div>
                    <p className="font-semibold text-foreground mb-2">Required Settings:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-muted-foreground">Background Max Frame Rate - same as Max Frame Rate</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-muted-foreground">Max Frame Rate - up to 98</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-muted-foreground">Vertical Sync - Off</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground mb-2">Quality Settings:</p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-muted-foreground">Anisotropic Filtering - 16x</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-muted-foreground">Antialiasing Mode - Enhance application setting</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-muted-foreground">Antialiasing Setting - 8x</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                        <span className="text-muted-foreground">Antialiasing Transparency - 8x supersample</span>
                      </li>
                    </ul>
                  </div>
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
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <p className="font-semibold text-foreground mb-2">Xbox Controllers:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span className="text-muted-foreground">Natively supported</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span className="text-muted-foreground">Must be enabled in main menu settings</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-2">PlayStation Controllers:</p>
                  <ol className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        1
                      </span>
                      <span className="text-muted-foreground">Add Shadowrun as Non-Steam Game</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        2
                      </span>
                      <span className="text-muted-foreground">Enable PlayStation Controller Support in Steam</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        3
                      </span>
                      <span className="text-muted-foreground">Connect controller via USB or Bluetooth</span>
                    </li>
                  </ol>
                </div>
                <div className="p-4 rounded-lg border-l-4 border-primary/50 bg-primary/5">
                  <p className="font-semibold text-foreground mb-2">
                    ⚠️ Important
                  </p>
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        Controller settings can ONLY be changed from the main menu
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">Cannot switch input methods during a match</span>
                    </li>
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
                <div className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
                  <p>
                    Follow our{" "}
                    <Link
                      href="/docs/install"
                      className="text-primary hover:underline font-medium"
                    >
                      installation guide
                    </Link>{" "}
                    for PC setup
                  </p>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>No Xbox Live Gold membership required</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Only needs key activation and Xbox.com account</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="text-lg sm:text-xl">Xbox Version</CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-2.5 text-sm sm:text-base text-muted-foreground">
                  <a
                    href="https://www.xbox.com/en-US/games/store/shadowrun/bsnjbk3gbdt3"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mb-2 text-primary hover:underline font-medium"
                  >
                    Available on Xbox Store ($14.99)
                  </a>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Xbox Live Gold required for public matchmaking</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span>Private matches may be accessible without Gold</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                    <span className="text-primary font-medium">
                      Game is most active in private lobbies
                    </span>
                  </div>
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
              <div className="space-y-4 text-sm sm:text-base">
                <div>
                  <p className="font-semibold text-foreground mb-2">Basic Troubleshooting:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span className="text-muted-foreground">Enable open NAT or UPnP in router settings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span className="text-muted-foreground">
                        Verify open NAT status in Xbox Console Companion App
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span className="text-muted-foreground">Check for PCID registry conflicts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
                      <span className="text-muted-foreground">Contact ISP about Carrier Grade NAT (CGNAT)</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border-l-4 border-primary/50 bg-primary/5">
                  <p className="font-semibold text-foreground mb-2">
                    ⚠️ Registry Fix
                  </p>
                  <ol className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        1
                      </span>
                      <span className="text-sm text-muted-foreground break-words">Uninstall GFWL components</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        2
                      </span>
                      <span className="text-sm text-muted-foreground break-words">
                        Open regedit as administrator
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        3
                      </span>
                      <span className="text-sm text-muted-foreground flex-1 min-w-0">
                        Navigate to{" "}
                        <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono break-all">
                          C:\Users\USERNAME\AppData\Local\Microsoft\Xlive
                        </code>
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        4
                      </span>
                      <span className="text-sm text-muted-foreground break-words">Delete the entire folder</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-1.5 flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-primary/20 text-primary flex-shrink-0">
                        5
                      </span>
                      <span className="text-sm text-muted-foreground break-words">Reinstall GFWL</span>
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Final Help Section */}
        <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-4 sm:p-6">
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-foreground">
            Still Having Issues?
          </h3>
          <p className="text-sm sm:text-base text-muted-foreground mb-3">
            If you&apos;ve tried everything above and still need assistance, our Discord community has experienced players ready to help troubleshoot your specific issue.
          </p>
          <a
            href="discord://discord.com/servers/this-is-shadowrun-930362820627943495"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm sm:text-base font-medium rounded-lg transition-all bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Get Help on Discord
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </article>
    </DocLayout>
  );
}

