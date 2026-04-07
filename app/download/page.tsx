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
  Package,
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

const PORTABLE_LAUNCHER_ZIP_URL =
  "https://pub-8a9c9dccd2fa45dea562e2e02706c5ec.r2.dev/Shadowrun%20FPS%20Launcher.zip";

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
    // Use our secure HTTPS API route which redirects to R2 presigned URL
    const fileName =
      versionInfo?.path || "Shadowrun FPS Launcher Setup 0.9.92.exe";
    const downloadUrl = `/api/launcher/download?file=${encodeURIComponent(
      fileName
    )}`;

    // Direct navigation - browser will handle the download
    // The API route redirects to R2 presigned URL with proper Content-Disposition headers
    window.location.href = downloadUrl;

    // Reset loading state after a delay
    setTimeout(() => setDownloading(false), 3000);
  };

  // Download page content
  return (
    <div className="w-full min-w-0 px-2 py-8 mx-auto sm:px-4 sm:py-12 md:container">
      <div className="mx-auto max-w-4xl min-w-0">
        <div className="px-2 py-4 mb-5 rounded-2xl shadow-xl backdrop-blur-sm bg-card/30 border-0 sm:p-6 sm:mb-8 md:p-8">
          <h1 className="mb-5 text-2xl font-bold text-left text-foreground break-words sm:text-3xl md:mb-6 md:text-center md:text-4xl">
            Download Shadowrun FPS Launcher
          </h1>

          <div className="px-2 py-4 mb-5 rounded-xl bg-card/50 border-0 sm:p-6 sm:mb-8">
            {versionError && (
              <div className="flex items-start gap-2 p-3 mb-4 rounded-lg border bg-yellow-500/10 border-yellow-500/30">
                <AlertCircle className="flex-shrink-0 mt-0.5 w-4 h-4 text-yellow-500" />
                <p className="min-w-0 text-sm text-yellow-500">{versionError}</p>
              </div>
            )}
            <h2 className="mb-2 text-xl font-bold break-words sm:text-2xl">
              Latest Version:{" "}
              {loadingVersion ? (
                <span className="inline-block w-20 h-6 rounded animate-pulse bg-muted" />
              ) : (
                versionInfo?.version || "Unknown"
              )}
            </h2>
            <p className="mb-2 text-sm text-muted-foreground break-words">
              File:{" "}
              {loadingVersion ? (
                <span className="inline-block w-48 h-4 rounded animate-pulse bg-muted" />
              ) : (
                <span className="break-all">{versionInfo?.path || "Unknown"}</span>
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
            <p className="mb-5 text-sm text-muted-foreground sm:mb-6 sm:text-base">
              Full NSIS installer with automatic update capabilities. Easy
              installation for Shadowrun FPS.
            </p>

            <div className="flex flex-col gap-3 justify-start sm:justify-center sm:flex-row sm:gap-4">
              <Button
                size="lg"
                className="w-full min-h-[44px] overflow-hidden relative group animate-pulse-slow border-0 focus-visible:ring-0 sm:w-auto"
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
          <div className="px-2 py-4 mb-5 rounded-xl bg-card/50 sm:p-6 sm:mb-8">
            <div className="flex items-center mb-3 sm:mb-4">
              <Sparkles className="mr-2 w-5 h-5 shrink-0 text-primary" />
              <h2 className="text-lg font-bold sm:text-xl">Key Features</h2>
            </div>

            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 bg-background/50 hover:bg-background/70 sm:p-4">
                <Zap className="flex-shrink-0 w-5 h-5 text-primary" />
                <div className="min-w-0">
                  <h3 className="mb-0.5 text-sm font-semibold sm:mb-1 sm:text-base">Auto-Update System</h3>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Launcher automatically checks for and installs updates
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 bg-background/50 hover:bg-background/70 sm:p-4">
                <Download className="flex-shrink-0 w-5 h-5 text-primary" />
                <div className="min-w-0">
                  <h3 className="mb-0.5 text-sm font-semibold sm:mb-1 sm:text-base">
                    One-Click Game Installation
                  </h3>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Automatically downloads and installs Shadowrun FPS
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 bg-background/50 hover:bg-background/70 sm:p-4">
                <Shield className="flex-shrink-0 w-5 h-5 text-primary" />
                <div className="min-w-0">
                  <h3 className="mb-0.5 text-sm font-semibold sm:mb-1 sm:text-base">
                    Automatic Key Generation
                  </h3>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    No manual CD key entry required
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 bg-background/50 hover:bg-background/70 sm:p-4">
                <Trash2 className="flex-shrink-0 w-5 h-5 text-primary" />
                <div className="min-w-0">
                  <h3 className="mb-0.5 text-sm font-semibold sm:mb-1 sm:text-base">Clean Uninstall</h3>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Easy removal with no leftover files
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Installation Instructions Section */}
          <div className="px-2 py-4 mb-5 rounded-xl bg-card/50 sm:p-6 sm:mb-8">
            <div className="flex items-center mb-3 sm:mb-4">
              <Info className="mr-2 w-5 h-5 shrink-0 text-primary" />
              <h2 className="text-lg font-bold sm:text-xl">Installation Instructions</h2>
            </div>

            <div className="px-2 py-3 mb-4 rounded-lg bg-background/50 sm:p-4">
              <ol className="space-y-2.5 list-decimal list-outside pl-5 text-sm text-muted-foreground sm:space-y-3 sm:list-inside sm:pl-0">
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
            <div className="px-2 py-3 rounded-lg bg-background/50 sm:p-4">
              <h3 className="mb-2 text-sm font-semibold text-foreground sm:mb-3 sm:text-base">
                System Requirements
              </h3>
              <ul className="space-y-0.5 text-xs text-muted-foreground sm:space-y-1 sm:text-sm">
                <li>
                  <strong className="text-foreground">OS:</strong> Windows 10
                  (64-bit)
                </li>
                <li>
                  <strong className="text-foreground">Requirements:</strong>{" "}
                  .NET Desktop Runtime 6.0
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

            <div className="flex items-start gap-3 px-2 py-3 mt-5 rounded-lg bg-card/70 sm:mt-6 sm:p-4">
              <AlertCircle className="flex-shrink-0 mt-0.5 w-5 h-5 text-primary" />
              <p className="min-w-0 text-xs text-muted-foreground sm:text-sm">
                <strong>Note:</strong> Some antivirus software may flag the
                launcher as suspicious due to its game file interactions. This
                is a false positive. The launcher has been verified safe by
                VirusTotal (see below). You may need to add an exception in your
                antivirus software.
              </p>
            </div>
          </div>

          {/* Portable launcher (ZIP) — no full install */}
          <div className="px-2 py-4 mb-5 rounded-xl bg-card/50 sm:p-6 sm:mb-8">
            <div className="flex items-center mb-3 sm:mb-4">
              <Package className="mr-2 w-5 h-5 shrink-0 text-primary" />
              <h2 className="text-lg font-bold sm:text-xl">
                Portable launcher (no installer)
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground sm:text-base">
              Prefer not to run the full installer? Download a portable ZIP
              that contains the launcher executable. Extract it anywhere you
              like and run it from there.
            </p>
            <div className="flex flex-col gap-3 justify-start sm:flex-row sm:gap-4">
              <Button
                size="lg"
                variant="outline"
                className="w-full min-h-[44px] sm:w-auto"
                asChild
              >
                <a
                  href={PORTABLE_LAUNCHER_ZIP_URL}
                  download="Shadowrun FPS Launcher.zip"
                  rel="noopener noreferrer"
                >
                  <Download className="mr-2 w-5 h-5" aria-hidden />
                  Download portable ZIP
                </a>
              </Button>
            </div>
            <div className="flex items-start gap-3 px-2 py-3 mt-5 rounded-lg bg-card/70 sm:mt-6 sm:p-4">
              <AlertCircle className="flex-shrink-0 mt-0.5 w-5 h-5 text-primary" />
              <p className="min-w-0 text-xs text-muted-foreground sm:text-sm">
                <strong>Important:</strong> If you use the launcher&apos;s
                built-in updater and install a new version, that process will
                perform a full install of the launcher on your PC. To stay on a
                portable-only setup, you must not use in-app updater; instead,
                download a new portable ZIP from this page when a new release is
                available and replace your old files.
              </p>
            </div>
          </div>

          {/* File Security Information */}
          <div className="px-2 py-4 rounded-xl bg-card/50 sm:p-6">
            <div className="flex items-center mb-3 sm:mb-4">
              <Shield className="mr-2 w-5 h-5 shrink-0 text-primary" />
              <h2 className="text-lg font-bold sm:text-xl">File Security Information</h2>
            </div>

            <div className="mb-4 min-w-0 overflow-x-auto">
              <VirusTotalWidget
                fileUrl="https://www.virustotal.com/gui/file/5f9e3edc7f5f92a094d7b6378f9b87a2e18d832f0f1ff995f899c5c1e9cf78dd?nocache=1"
                fileName="Shadowrun FPS Launcher Setup.exe"
              />
            </div>

            <div className="grid gap-2 text-sm sm:gap-3">
              <div className="flex flex-col gap-0.5 px-2 py-3 rounded-lg bg-background/50 sm:flex-row sm:justify-between sm:gap-2 sm:p-3">
                <span className="text-xs text-muted-foreground sm:text-sm">Verified by:</span>
                <span className="font-semibold">VirusTotal</span>
              </div>
              <div className="flex flex-col gap-0.5 px-2 py-3 rounded-lg bg-background/50 sm:flex-row sm:justify-between sm:items-center sm:gap-2 sm:p-3">
                <span className="text-xs text-muted-foreground sm:text-sm">Status:</span>
                <span className="flex items-center gap-1 font-semibold text-green-500">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  Safe to Download
                </span>
              </div>
              <div className="flex flex-col gap-0.5 px-2 py-3 rounded-lg bg-background/50 sm:flex-row sm:justify-between sm:gap-2 sm:p-3">
                <span className="text-xs text-muted-foreground sm:text-sm">File:</span>
                <span className="break-all font-semibold">
                  Shadowrun FPS Launcher Setup.exe
                </span>
              </div>
              <div className="flex flex-col gap-2 px-2 py-3 rounded-lg bg-background/50 sm:flex-row sm:justify-between sm:items-start sm:gap-2 sm:p-3">
                <span className="text-xs text-muted-foreground shrink-0 sm:text-sm">SHA256:</span>
                <div className="flex gap-2 items-center min-w-0 w-full sm:w-auto sm:flex-1 sm:justify-end">
                  <span className="font-mono text-xs break-all min-w-0">
                    5f9e3edc7f5f92a094d7b6378f9b87a2e18d832f0f1ff995f899c5c1e9cf78dd
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyHash}
                    className="flex-shrink-0 min-w-[44px] min-h-[44px] p-0 w-10 h-10 sm:w-8 sm:h-8 sm:min-w-0 sm:min-h-0"
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
              <div className="flex flex-col gap-0.5 px-2 py-3 rounded-lg bg-background/50 sm:flex-row sm:justify-between sm:gap-2 sm:p-3">
                <span className="text-xs text-muted-foreground sm:text-sm">Digitally Signed:</span>
                <span className="font-semibold">Sinful Hollowz</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
