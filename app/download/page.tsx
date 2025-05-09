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
    window.location.href =
      "http://157.245.214.234/releases/Shadowrun%20FPS%20Launcher.exe";
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
      <div className="max-w-4xl mx-auto">
        <div className="p-8 mb-8 transition-all duration-300 border shadow-xl bg-card/30 backdrop-blur-sm rounded-2xl border-border/50 hover:shadow-primary/10 hover:shadow-2xl">
          <h1 className="mb-6 text-4xl font-bold text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/90 to-primary animate-gradient">
              Download Shadowrun FPS Launcher
            </span>
          </h1>

          <div className="p-6 mb-8 transition-all duration-300 border hover:bg-card/70 bg-card/50 rounded-xl border-border/50">
            <h2 className="mb-4 text-2xl font-bold">Latest Version</h2>
            <p className="mb-6 text-muted-foreground">
              Our launcher provides a streamlined installation process for
              Shadowrun FPS.
            </p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button
                size="lg"
                className="relative overflow-hidden group animate-pulse-slow"
                onClick={handleDownload}
                disabled={downloading}
              >
                <span className="relative z-10 flex items-center">
                  <Download className="w-5 h-5 mr-2" />
                  {downloading ? "Downloading..." : "Download Launcher"}
                </span>
                <div className="absolute inset-0 transition-transform duration-300 -z-10 bg-gradient-to-r from-primary to-primary/90 group-hover:scale-110" />
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
                  className="relative overflow-hidden cursor-not-allowed group opacity-70"
                  disabled
                >
                  <span className="relative z-10 flex items-center">
                    <Github className="w-5 h-5 mr-2" />
                    View Source on GitHub
                  </span>
                </Button>
                {showTooltip && (
                  <div className="absolute z-10 w-48 px-3 py-2 mb-2 text-xs duration-200 transform -translate-x-1/2 rounded-md shadow-md bottom-full left-1/2 bg-popover text-popover-foreground animate-in fade-in">
                    <span className="font-medium">GitHub Coming Soon</span>
                    <div className="absolute transform -translate-x-1/2 border-4 border-transparent top-full left-1/2 border-t-popover"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 mb-8 transition-all duration-300 border hover:bg-card/70 bg-card/50 rounded-xl border-border/50">
            <div className="flex items-center mb-4">
              <Info className="w-5 h-5 mr-2 text-primary" />
              <h2 className="text-xl font-bold">Installation Instructions</h2>
            </div>

            <div className="p-4 mb-4 border rounded-lg bg-background/50 border-border/50">
              <ol className="space-y-2 list-decimal list-inside text-muted-foreground">
                <li className="transition-all duration-200 hover:text-foreground">
                  Open Launcher and click Download
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Once downloads are complete, click Play to launch the game
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Sign into your Xbox account in GFWL until you get to the Key
                  Activation screen
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  Use a valid key to activate the game (Key Bypass coming soon)
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

            <div className="flex items-start p-4 mt-6 border rounded-lg bg-card/70 border-border/50">
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
              fileHash="87adfa7b167930934a738bfa2ee53e9d110dc51d6cb072063f6c86708fdabb58"
              fileName="Shadowrun FPS Launcher.exe"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
