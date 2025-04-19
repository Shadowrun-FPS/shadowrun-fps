import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
      <article className="space-y-8">
        <section id="errors" className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Common Errors</h2>
          <p className="text-lg leading-relaxed text-muted-foreground">
            Find solutions to common issues and error messages below. Click on
            an error to see its solution.
          </p>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {errorAccordions.map((error, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className={cn(
                  "group border border-border/40 rounded-lg mb-3 shadow-sm",
                  "transition-all duration-200 hover:shadow-md hover:border-border/80",
                  "data-[state=open]:shadow-md data-[state=open]:border-primary/20 data-[state=open]:bg-accent/5"
                )}
              >
                <AccordionTrigger className="px-3 py-4 text-lg text-left sm:px-6 hover:no-underline">
                  {error.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="px-3 pt-2 pb-4 sm:px-6">
                    {error.content && (
                      <p className="leading-relaxed">{error.content}</p>
                    )}
                    {error.list && (
                      <ul className="pl-6 space-y-2 list-disc">
                        {error.list.map((item, i) => (
                          <li key={i} className="leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {error.href && (
                      <a
                        href={error.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-2 text-primary hover:underline"
                      >
                        {error.link || "Download fix"}
                        <span className="sr-only">Opens in new tab</span>
                      </a>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section id="activation" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Activation Issues
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4 text-sm text-muted-foreground">
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

        <section id="performance" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Performance Settings
          </h2>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>FPS Limitations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-muted-foreground">
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
              <CardHeader>
                <CardTitle>NVIDIA Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm text-muted-foreground">
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
        <section id="controller" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Controller Setup
          </h2>
          <Card>
            <CardHeader>
              <CardTitle>Controller Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-muted-foreground">
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

        <section id="getting-game" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Getting the Game
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>PC Version</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
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
              <CardHeader>
                <CardTitle>Xbox Version</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
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

        <section id="connection" className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            Connection Issues
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4 text-sm text-muted-foreground">
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

const commonIssues = [
  {
    title: "Game Won't Launch",
    description: "If the game fails to start or crashes on launch",
    steps: [
      "Verify game files integrity",
      "Update graphics drivers",
      "Run as administrator",
      "Check DirectX installation",
      "Verify Windows compatibility settings",
    ],
  },
  {
    title: "Performance Issues",
    description: "If you're experiencing lag or low FPS",
    steps: [
      "Update graphics drivers",
      "Close background applications",
      "Check system requirements",
      "Verify game settings",
      "Run in compatibility mode",
    ],
  },
  // ... keep other common issues
];

const errorAccordions = [
  {
    title: "Game Won't Launch",
    content: "If the game fails to start or crashes on launch",
    list: [
      "Verify game files integrity",
      "Update graphics drivers",
      "Run as administrator",
      "Check DirectX installation",
      "Verify Windows compatibility settings",
    ],
  },
  {
    title: "Performance Issues",
    content: "If you're experiencing lag or low FPS",
    list: [
      "Update graphics drivers",
      "Close background applications",
      "Check system requirements",
      "Verify game settings",
      "Run in compatibility mode",
    ],
  },
  {
    title: "Error: d3dx9 error - install this",
    content: "Install the DirectX installer to resolve d3dx9 errors.",
    href: "https://www.microsoft.com/en-us/download/details.aspx?id=35",
    link: "DirectX installer",
  },
  {
    title: "Error 1603 or 1722",
    content:
      'Verify you have all drivers installed and up to date via optional Windows updates. Open CMD as an administrator and run the command "sfc/scannow" to check for repairable Windows system errors.',
  },
  {
    title: 'Error "xlive.dll not found"',
    content:
      'Verify that the Games for Windows Live installer was extracted before installing. Open "services msc" from the start menu search bar. Right-click and start "Xbox Live Networking Service" or restart the game.',
  },
  {
    title: "Error 0x80072746",
    content:
      'Open "services msc" from the start menu search bar. Right-click and start "Windows License Manager Service" or restart the game (potentially conflicts with VPN to activate, though, unconfirmed).',
  },
  {
    title: "Error Ordinal 43",
    content: "GFWL wasn't extracted properly.",
    list: ["Re-extract and reinstall GFWL."],
  },
  {
    title: "Error Unable to create Direct3D Device",
    list: [
      "Install DirectX or update missing or outdated drivers.",
      "Test with the compatibility tool provided.",
    ],
  },

  {
    title: "Error 0x8007065b",
    content: "Microsoft server account issue.",
    list: [
      "Create a new free account at Xbox.com and login with it.",
      "Try signing into the original account after a day or so.",
    ],
  },

  {
    title: "Xbox Login Issues",
    content: "Various fixes you can try.",
    list: [
      "Disable 2FA",
      "Turn off VPN",
      "Add GFWL & Shadowrun to firewall exceptions",
      "Uninstall GFWL and try reinstalling it in Windows 7 compatibility mode",
      "Verify open NAT status",
      "Password could be too long (max pass length 11-16 characters)",
      "Xbox account changes can be delayed 10ish minutes to update",
      "Sign out of Xbox Game Bar/Xbox app, sign back in, and retry on Shadowrun",
      "Open services.msc and restart 'Windows License Manager' and 'Xbox Live Networking Service'",
      "Update Windows & optional Windows updates for driver/security updates",
      "Restart PC",
      "Create a new gamertag on Xbox.com (doesn't even require email verification) & add other profile after activation",
    ],
  },
  {
    title: "Error Need Multiplayer Enabled",
    content:
      "Xbox settings - system - storage devices - clear local Xbox 360 storage",
  },
  {
    title: "Controller doesn't work in-game",
    content:
      "Return to the game's main menu screen. Go to Settings > Gamepad and set the input as 'Gamepad'. This MUST be changed in the main menu settings and cannot be changed mid-game.",
  },
  {
    title: "Controller Support",
    content:
      "Xbox controllers are supported natively. For ALL controllers (including Xbox):",
    list: [
      "Must be configured in the main menu's Gamepad settings",
      "Cannot switch between Gamepad and Mouse & Keyboard during a match",
      "Settings changes must be done from the main menu",
      "For PlayStation controllers, use <Link href='/troubleshoot#controller'>Steam's controller configuration</Link>",
    ],
  },
];
