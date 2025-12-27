"use client";

import { useState, useEffect } from "react";
import {
  Download,
  AlertCircle,
  Info,
  CheckCircle2,
  Zap,
  Shield,
  Sparkles,
  Trash2,
  Copy,
  Check,
} from "lucide-react";
import VirusTotalWidget from "@/components/VirusTotalWidget";
import { Button } from "@/components/ui/button";
import { safeLog } from "@/lib/security";

interface LauncherVersion {
  version: string;
  path: string;
  size: number;
  releaseDate: string;
}

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [versionInfo, setVersionInfo] = useState<LauncherVersion | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(true);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);

  // Fetch latest version info - using deduplication to prevent duplicate calls
  useEffect(() => {
    const fetchVersionInfo = async () => {
      setLoadingVersion(true);
      setVersionError(null);
      try {
        // ✅ Use deduplicated fetch to prevent duplicate calls
        const { deduplicatedFetch } = await import(
          "@/lib/request-deduplication"
        );
        const versionInfo = await deduplicatedFetch<LauncherVersion>(
          "/api/launcher/version",
          { ttl: 60000 } // Cache for 1 minute
        );

        setVersionInfo(versionInfo);
      } catch (error) {
        safeLog.error("Failed to fetch version info:", error);
        setVersionError(
          "Unable to fetch latest version. Using fallback version."
        );
        // Fallback to default version
        setVersionInfo({
          version: "0.9.92",
          path: "Shadowrun FPS Launcher Setup 0.9.92.exe",
          size: 83436397,
          releaseDate: new Date().toISOString(),
        });
      } finally {
        setLoadingVersion(false);
      }
    };

    fetchVersionInfo();
  }, []);

  // Format file size with decimals
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb % 1 === 0 ? `${mb} MB` : `${mb.toFixed(1)} MB`;
  };

  // Copy SHA256 hash to clipboard
  const copyHash = async () => {
    const hash =
      "5f9e3edc7f5f92a094d7b6378f9b87a2e18d832f0f1ff995f899c5c1e9cf78dd";
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (error) {
      safeLog.error("Failed to copy hash:", error);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    // Use our secure HTTPS proxy to avoid mixed content errors
    const fileName =
      versionInfo?.path || "Shadowrun FPS Launcher Setup 0.9.92.exe";
    const downloadUrl = `/api/launcher/download?file=${encodeURIComponent(
      fileName
    )}`;
    window.location.href = downloadUrl;
    setTimeout(() => setDownloading(false), 3000);
  };

  // Download page content
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
            {versionError && (
              <div className="flex items-start p-3 mb-4 rounded-lg border bg-yellow-500/10 border-yellow-500/30">
                <AlertCircle className="flex-shrink-0 mt-0.5 mr-2 w-4 h-4 text-yellow-500" />
                <p className="text-sm text-yellow-500">{versionError}</p>
              </div>
            )}
            <h2 className="mb-2 text-2xl font-bold">
              Latest Version:{" "}
              {loadingVersion ? (
                <span className="inline-block w-20 h-6 rounded animate-pulse bg-muted" />
              ) : (
                versionInfo?.version || "Unknown"
              )}
            </h2>
            <p className="mb-2 text-sm text-muted-foreground">
              File:{" "}
              {loadingVersion ? (
                <span className="inline-block w-48 h-4 rounded animate-pulse bg-muted" />
              ) : (
                versionInfo?.path || "Unknown"
              )}
            </p>
            <p className="mb-2 text-sm text-muted-foreground">
              Size:{" "}
              {loadingVersion ? (
                <span className="inline-block w-16 h-4 rounded animate-pulse bg-muted" />
              ) : versionInfo ? (
                `${formatFileSize(
                  versionInfo.size
                )} (installer with auto-update)`
              ) : (
                "~85 MB"
              )}
            </p>
            {loadingVersion ? (
              <p className="mb-2 text-sm text-muted-foreground">
                Released:{" "}
                <span className="inline-block w-32 h-4 rounded animate-pulse bg-muted" />
              </p>
            ) : (
              versionInfo?.releaseDate && (
                <p className="mb-2 text-sm text-muted-foreground">
                  Released:{" "}
                  {new Date(versionInfo.releaseDate).toLocaleDateString(
                    "en-US",
                    {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              )
            )}
            <p className="mb-6 text-muted-foreground">
              Full NSIS installer with automatic update capabilities. Easy
              installation for Shadowrun FPS.
            </p>

            <div className="flex flex-col gap-4 justify-center sm:flex-row">
              <Button
                size="lg"
                className="overflow-hidden relative group animate-pulse-slow"
                onClick={handleDownload}
                disabled={downloading || loadingVersion}
              >
                <span className="flex relative z-10 items-center">
                  <Download className="mr-2 w-5 h-5" />
                  {downloading
                    ? "Downloading..."
                    : loadingVersion
                    ? "Loading..."
                    : "Download Launcher"}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r transition-transform duration-300 -z-10 from-primary to-primary/90 group-hover:scale-110" />
                <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
              </Button>
            </div>
          </div>

          {/* Key Features Section */}
          <div className="p-6 mb-8 rounded-xl border transition-all duration-300 hover:bg-card/70 bg-card/50 border-border/50">
            <div className="flex items-center mb-4">
              <Sparkles className="mr-2 w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Key Features</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start p-4 rounded-lg border transition-all duration-200 bg-background/50 border-border/50 hover:bg-background/70">
                <Zap className="flex-shrink-0 mr-3 w-5 h-5 text-primary" />
                <div>
                  <h3 className="mb-1 font-semibold">Auto-Update System</h3>
                  <p className="text-sm text-muted-foreground">
                    Launcher automatically checks for and installs updates
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 rounded-lg border transition-all duration-200 bg-background/50 border-border/50 hover:bg-background/70">
                <Download className="flex-shrink-0 mr-3 w-5 h-5 text-primary" />
                <div>
                  <h3 className="mb-1 font-semibold">
                    One-Click Game Installation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically downloads and installs Shadowrun FPS
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 rounded-lg border transition-all duration-200 bg-background/50 border-border/50 hover:bg-background/70">
                <Shield className="flex-shrink-0 mr-3 w-5 h-5 text-primary" />
                <div>
                  <h3 className="mb-1 font-semibold">
                    Automatic Key Generation
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    No manual CD key entry required
                  </p>
                </div>
              </div>

              <div className="flex items-start p-4 rounded-lg border transition-all duration-200 bg-background/50 border-border/50 hover:bg-background/70">
                <Trash2 className="flex-shrink-0 mr-3 w-5 h-5 text-primary" />
                <div>
                  <h3 className="mb-1 font-semibold">Clean Uninstall</h3>
                  <p className="text-sm text-muted-foreground">
                    Easy removal with no leftover files
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Installation Instructions Section */}
          <div className="p-6 mb-8 rounded-xl border transition-all duration-300 hover:bg-card/70 bg-card/50 border-border/50">
            <div className="flex items-center mb-4">
              <Info className="mr-2 w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Installation Instructions</h2>
            </div>

            <div className="p-4 mb-4 rounded-lg border bg-background/50 border-border/50">
              <ol className="space-y-3 list-decimal list-inside text-muted-foreground">
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">Prerequisites:</strong>{" "}
                  <a
                    href="https://dotnet.microsoft.com/download/dotnet/6.0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                    aria-label=".NET Desktop Runtime 6.0 (opens in new window)"
                  >
                    .NET Desktop Runtime 6.0
                  </a>
                </li>

                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">
                    Download the Installer:
                  </strong>{" "}
                  Click the &quot;Download Launcher&quot; button above to
                  download the installer.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">
                    Install the Launcher:
                  </strong>{" "}
                  Run the installer and follow the prompts to install the
                  launcher.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">
                    Download Game Files:
                  </strong>{" "}
                  Open the launcher and press &quot;Download&quot; to
                  automatically download the required game files.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">
                    Press Activate Game:
                  </strong>{" "}
                  Once file downloads are complete, press &quot;Activate
                  Game&quot;.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">Launch & Sign In:</strong>{" "}
                  Launch the game and sign into your Xbox account in GFWL.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">Finish & Play:</strong>{" "}
                  Wait for activation to finish, then close the game completely.
                  Restart the game and you&apos;re ready to play!
                </li>
              </ol>
              <br />
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Due to how our activation works,
                activation may break at any time. If this happens, just press
                Activate Game again.
              </p>
            </div>

            {/* System Requirements */}
            <div className="p-4 rounded-lg border bg-background/50 border-border/50">
              <h3 className="mb-3 font-semibold text-foreground">
                System Requirements
              </h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  <strong className="text-foreground">OS:</strong> Windows 10
                  (64-bit)
                </li>
                <li>
                  <strong className="text-foreground">Requirements:</strong>{" "}
                  .NET Desktop Runtime 6.0 (auto-installed)
                </li>
                <li>
                  <strong className="text-foreground">
                    Installation Size:
                  </strong>{" "}
                  ~85 MB (launcher) + ~2 GB (game)
                </li>
                <li>
                  <strong className="text-foreground">Internet:</strong>{" "}
                  Required for download and updates
                </li>
              </ul>
            </div>

            <div className="flex items-start p-4 mt-6 rounded-lg border bg-card/70 border-border/50">
              <AlertCircle className="flex-shrink-0 mt-1 mr-3 text-primary" />
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Some antivirus software may flag the
                launcher as suspicious due to its game file interactions. This
                is a false positive. The launcher has been verified safe by
                VirusTotal (see below). You may need to add an exception in your
                antivirus software.
              </p>
            </div>
          </div>

          {/* File Security Information */}
          <div className="p-6 rounded-xl border transition-all duration-300 hover:bg-card/70 bg-card/50 border-border/50">
            <div className="flex items-center mb-4">
              <Shield className="mr-2 w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">File Security Information</h2>
            </div>

            <div className="mb-4">
              <VirusTotalWidget
                fileUrl="https://www.virustotal.com/gui/file/5f9e3edc7f5f92a094d7b6378f9b87a2e18d832f0f1ff995f899c5c1e9cf78dd?nocache=1"
                fileName="Shadowrun FPS Launcher Setup.exe"
              />
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between p-3 rounded-lg bg-background/50">
                <span className="text-muted-foreground">Verified by:</span>
                <span className="font-semibold">VirusTotal</span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-background/50">
                <span className="text-muted-foreground">Status:</span>
                <span className="flex items-center font-semibold text-green-500">
                  <CheckCircle2 className="mr-1 w-4 h-4" />
                  Safe to Download
                </span>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-background/50">
                <span className="text-muted-foreground">File:</span>
                <span className="font-semibold">
                  Shadowrun FPS Launcher Setup.exe
                </span>
              </div>
              <div className="flex gap-2 justify-between items-center p-3 rounded-lg bg-background/50">
                <span className="text-muted-foreground">SHA256:</span>
                <div className="flex flex-1 gap-2 justify-end items-center min-w-0">
                  <span className="font-mono text-xs text-right break-all">
                    5f9e3edc7f5f92a094d7b6378f9b87a2e18d832f0f1ff995f899c5c1e9cf78dd
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyHash}
                    className="flex-shrink-0 p-0 w-8 h-8"
                    aria-label="Copy SHA256 hash"
                  >
                    {copiedHash ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-between p-3 rounded-lg bg-background/50">
                <span className="text-muted-foreground">Digitally Signed:</span>
                <span className="font-semibold">Sinful Hollowz</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
