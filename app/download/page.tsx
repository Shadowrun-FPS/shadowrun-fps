"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Github,
  AlertCircle,
  Info,
  CheckCircle2,
} from "lucide-react";
import VirusTotalWidget from "@/components/VirusTotalWidget";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Feature flag check
const ENABLE_DOWNLOAD_PAGE =
  process.env.NEXT_PUBLIC_ENABLE_DOWNLOAD_PAGE === "true";

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if download page is enabled
    if (!ENABLE_DOWNLOAD_PAGE) {
      // Redirect to home page after a short delay
      const timer = setTimeout(() => {
        router.push("/");
      }, 2000);

      return () => clearTimeout(timer);
    } else {
      setIsAuthorized(true);
    }
  }, [router]);

  const handleDownload = () => {
    setDownloading(true);
    window.location.href = "/api/download";
    setTimeout(() => setDownloading(false), 3000);
  };

  // If not authorized, show coming soon message
  if (!isAuthorized) {
    return (
      <div className="container flex flex-col items-center justify-center min-h-[70vh] px-4 py-12 mx-auto text-center">
        <h1 className="mb-6 text-4xl font-bold">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-primary animate-gradient">
            Download Coming Soon
          </span>
        </h1>
        <p className="mb-8 text-xl text-muted-foreground">
          The Shadowrun FPS Launcher download page is not available yet.
        </p>
        <Button asChild>
          <Link href="/">Return to Home</Link>
        </Button>
      </div>
    );
  }

  // Original download page content
  return (
    <div className="container px-4 py-12 mx-auto">
      <div className="mx-auto max-w-4xl">
        <div className="p-8 mb-8 rounded-2xl border shadow-xl backdrop-blur-sm transition-all duration-300 bg-card/30 border-border/50 hover:shadow-primary/10 hover:shadow-2xl">
          <h1 className="mb-6 text-4xl font-bold text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-primary animate-gradient">
              Download Shadowrun FPS Launcher
            </span>
          </h1>

          <div className="p-6 mb-8 rounded-xl border transition-all duration-300 hover:bg-card/70 bg-card/50 border-border/50">
            <h2 className="mb-4 text-2xl font-bold">Latest Version</h2>
            <p className="mb-6 text-muted-foreground">
              Our launcher provides a streamlined installation process for
              Shadowrun FPS.
            </p>

            <div className="flex flex-col gap-4 justify-center sm:flex-row">
              <Button
                size="lg"
                className="overflow-hidden relative group animate-pulse-slow"
                onClick={handleDownload}
                disabled={downloading}
              >
                <span className="flex relative z-10 items-center">
                  <Download className="mr-2 w-5 h-5" />
                  {downloading ? "Downloading..." : "Download Launcher"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r transition-transform duration-300 -z-10 from-primary to-primary/90 group-hover:scale-110" />
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </Button>

              <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <Button
                  size="lg"
                  variant="outline"
                  className="overflow-hidden relative group"
                  asChild
                >
                  <Link
                    href="https://github.com/shub-wub/Shadowrun-Launcher-WPF"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span className="flex relative z-10 items-center">
                      <Github className="mr-2 w-5 h-5" />
                      View Source on GitHub
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 mb-8 rounded-xl border transition-all duration-300 hover:bg-card/70 bg-card/50 border-border/50">
            <div className="flex items-center mb-4">
              <Info className="mr-2 w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Installation Instructions</h2>
            </div>

            <div className="p-4 mb-4 rounded-lg border bg-background/50 border-border/50">
              <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                <li className="transition-all duration-200 hover:text-foreground">
                  Once downloaded, unzip the folder. Run ShadowrunLauncher.exe
                  and click Download
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Once downloads are complete, click Play to launch the game.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Sign into your Xbox account in GFWL until you get to the Key
                  Activation screen
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Return to the Launcher and Click Generate Key
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Return to the game and it should auto-input the key for you.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  After signed in and activated, please close the game and
                  re-launch it from the launcher.
                </li>

                {/* <li className="transition-all duration-200 hover:text-foreground">
                  Press Generate Key
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Press back arrow in GFWL
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Press the HOME button on your keyboard
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Press Connect to LIVE
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Close the game
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Press Play
                </li> */}
              </ol>
            </div>

            <div className="flex items-start p-4 mt-6 rounded-lg border bg-card/70 border-border/50">
              <AlertCircle className="flex-shrink-0 mt-1 mr-3 text-primary" />
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Some antivirus software may flag the
                launcher as suspicious. This is a false positive due to the way
                the launcher interacts with game files. The launcher has been
                verified with VirusTotal (see below). You may need to add an
                exception in your antivirus software.
              </p>
            </div>
          </div>

          {/* Enhanced VirusTotal Widget */}
          <div className="mt-6">
            <VirusTotalWidget
              fileUrl="https://www.virustotal.com/gui/url/5c3783fa496b5e468c580cf7cf30820a107451aea22ff7eaae68513a6ca00432/detection"
              fileName="ShadowrunLauncher.zip"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
