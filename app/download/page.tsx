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
  ScrollText,
  Settings2,
  FileText,
} from "lucide-react";

import { ChangelogDialogSkeleton } from "@/components/changelog-dialog-skeleton";
import { ChangelogNoteItem } from "@/components/changelog-note-item";
import VirusTotalWidget from "@/components/VirusTotalWidget";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  LAUNCHER_MAIN_LOG_PATH,
  PORTABLE_LAUNCHER_ZIP_URL,
} from "@/lib/download-urls";
import { safeLog } from "@/lib/security";
import type { LauncherChangelogEntry } from "@/types/launcher";

interface LauncherVersion {
  version: string;
  path: string;
  size: number;
  releaseDate: string;
}

/** Primary installer on this page — must match the build you scanned on VirusTotal. */
const LAUNCHER_INSTALLER_SHA256 =
  "a5a8b426120c430e001cc4bd8cd5b6b4716b3e5120d09fde7d3dd2d4a9045afb";

/** Installer version for the SHA256 above (update together when you publish + rescan). */
const LAUNCHER_VIRUSTOTAL_SCAN_VERSION = "0.9.112";

const LAUNCHER_VIRUSTOTAL_URL = `https://www.virustotal.com/gui/file/${LAUNCHER_INSTALLER_SHA256}?nocache=1`;

export default function DownloadPage() {
  const [downloading, setDownloading] = useState(false);
  const [versionInfo, setVersionInfo] = useState<LauncherVersion | null>(null);
  const [loadingVersion, setLoadingVersion] = useState(true);
  const [versionError, setVersionError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedLogPath, setCopiedLogPath] = useState(false);
  const [changelogOpen, setChangelogOpen] = useState(false);
  const [changelogEntries, setChangelogEntries] = useState<
    LauncherChangelogEntry[] | null
  >(null);
  const [changelogLoading, setChangelogLoading] = useState(false);
  const [changelogError, setChangelogError] = useState<string | null>(null);
  /** Avoid SSR/client mismatch on `disabled`: server snapshot omits client-only busy state. */
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
          version: "0.9.107",
          path: "Shadowrun FPS Launcher Setup 0.9.107.exe",
          size: 194002854,
          releaseDate: new Date().toISOString(),
        });
      } finally {
        setLoadingVersion(false);
      }
    };

    fetchVersionInfo();
  }, []);

  useEffect(() => {
    if (!changelogOpen) return;
    if (changelogEntries !== null) return;

    let cancelled = false;
    (async () => {
      setChangelogLoading(true);
      setChangelogError(null);
      try {
        const { deduplicatedFetch } = await import(
          "@/lib/request-deduplication"
        );
        const data = await deduplicatedFetch<{ entries: LauncherChangelogEntry[] }>(
          "/api/launcher/changelog",
          { ttl: 5 * 60 * 1000 }
        );
        if (!cancelled) {
          setChangelogEntries(data.entries);
        }
      } catch (error) {
        safeLog.error("Failed to load changelog:", error);
        if (!cancelled) {
          setChangelogError("Couldn't load changelog. Try again later.");
        }
      } finally {
        if (!cancelled) {
          setChangelogLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [changelogOpen, changelogEntries]);

  // Format file size with decimals
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb % 1 === 0 ? `${mb} MB` : `${mb.toFixed(1)} MB`;
  };

  // Copy SHA256 hash to clipboard
  const copyHash = async () => {
    const hash = LAUNCHER_INSTALLER_SHA256;
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch (error) {
      safeLog.error("Failed to copy hash:", error);
    }
  };

  const copyLauncherLogPath = async () => {
    try {
      await navigator.clipboard.writeText(LAUNCHER_MAIN_LOG_PATH);
      setCopiedLogPath(true);
      setTimeout(() => setCopiedLogPath(false), 2000);
    } catch (error) {
      safeLog.error("Failed to copy launcher log path:", error);
    }
  };

  const handleDownload = () => {
    setDownloading(true);
    // Use our secure HTTPS API route which redirects to R2 presigned URL
    const fileName =
      versionInfo?.path || "Shadowrun FPS Launcher Setup 0.9.107.exe";
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
              Full NSIS installer with automatic update capabilities. The launcher
              downloads an updated game ZIP{" "}
              <strong className="font-medium text-foreground">
                pre-configured for AntHill LIVE (AHL)
              </strong>{" "}
              — our private Games for Windows LIVE–compatible service for
              community online play.
            </p>

            <div className="flex flex-col gap-2 justify-start items-stretch sm:items-center sm:gap-3">
              <div className="flex flex-col gap-3 justify-start sm:justify-center sm:flex-row sm:gap-4">
                <Button
                  size="lg"
                  className="w-full min-h-[44px] overflow-hidden relative group animate-pulse-slow border-0 focus-visible:ring-0 sm:w-auto"
                  onClick={handleDownload}
                  disabled={
                    downloading || (hasMounted && loadingVersion)
                  }
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
              <button
                type="button"
                onClick={() => setChangelogOpen(true)}
                className="flex gap-1.5 justify-center items-center self-center text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/90 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md px-2 py-1 min-h-[44px] sm:min-h-0"
              >
                <ScrollText className="w-4 h-4 shrink-0 opacity-70" aria-hidden />
                View changelog
              </button>
            </div>

            <Dialog
              open={changelogOpen}
              onOpenChange={(open) => {
                setChangelogOpen(open);
                if (!open && changelogError) {
                  setChangelogEntries(null);
                  setChangelogError(null);
                }
              }}
            >
              <DialogContent className="gap-0 overflow-hidden border-border/50 p-0 shadow-lg max-w-[min(calc(100vw-1rem),40rem)] sm:max-w-xl">
                <DialogHeader className="gap-1 px-6 pt-6 pb-4 pr-14 space-y-0">
                  <DialogTitle className="text-lg font-semibold tracking-tight">
                    Launcher changelog
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground">
                    Recent updates from the Shadowrun FPS Launcher releases.
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[min(75vh,32rem)] px-6 pb-6 pt-1">
                  <div className="pr-3">
                    {changelogLoading && <ChangelogDialogSkeleton />}
                    {!changelogLoading && changelogError && (
                      <p className="text-sm text-destructive">{changelogError}</p>
                    )}
                    {!changelogLoading &&
                      !changelogError &&
                      changelogEntries &&
                      changelogEntries.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No entries yet.
                        </p>
                      )}
                    {!changelogLoading &&
                      changelogEntries &&
                      changelogEntries.length > 0 && (
                        <div className="space-y-12">
                          {changelogEntries.map((entry, releaseIndex) => (
                            <section
                              key={entry.version}
                              className="space-y-5"
                              aria-labelledby={`changelog-${entry.version}`}
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <h3
                                    id={`changelog-${entry.version}`}
                                    className="text-[15px] font-semibold text-sky-300"
                                  >
                                    v{entry.version}
                                  </h3>
                                  {releaseIndex === 0 && (
                                    <span className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                                      Latest
                                    </span>
                                  )}
                                </div>
                                <time
                                  className="text-xs tabular-nums text-muted-foreground sm:text-sm"
                                  dateTime={entry.date}
                                >
                                  {entry.date}
                                </time>
                              </div>
                              <ul className="m-0 list-none space-y-5 p-0">
                                {entry.notes.map((note, idx) => (
                                  <ChangelogNoteItem
                                    key={`${entry.version}-${idx}`}
                                    note={note}
                                  />
                                ))}
                              </ul>
                            </section>
                          ))}
                        </div>
                      )}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
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
                    Automatically downloads and installs Shadowrun FPS (AHL-ready
                    game files)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg transition-all duration-200 bg-background/50 hover:bg-background/70 sm:p-4">
                <Settings2 className="flex-shrink-0 w-5 h-5 text-primary" />
                <div className="min-w-0">
                  <h3 className="mb-0.5 text-sm font-semibold sm:mb-1 sm:text-base">
                    AHL ↔ classic GFWL toggle
                  </h3>
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    Switch between AntHill LIVE and Xbox GFWL in the launcher — no
                    config file edits.
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
                  Open the launcher and press &quot;Download&quot; to fetch the
                  ZIP — it ships{" "}
                  <strong className="text-foreground">
                    pre-configured for AntHill LIVE (AHL)
                  </strong>
                  .
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">
                    Optional — Activate Game (classic GFWL online only):
                  </strong>{" "}
                  Only if you play <strong className="text-foreground">online</strong>{" "}
                  on standard Xbox Games for Windows LIVE (after switching the
                  launcher off AntHill LIVE): when your downloads are complete,
                  press &quot;Activate Game&quot; in the launcher.{" "}
                  <strong className="text-foreground">Skip</strong> this when using
                  AntHill LIVE (AHL).
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">AntHill LIVE (AHL):</strong>{" "}
                  Playing online on our servers does not use the &quot;Activate
                  Game&quot; button or retail game keys — only the account steps
                  below.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">
                    AntHill LIVE account (online):
                  </strong>
                  <ol className="mt-2 list-[lower-alpha] space-y-2 pl-6 text-muted-foreground marker:text-muted-foreground [&>li]:pl-1">
                    <li className="transition-all duration-200 hover:text-foreground">
                      <strong className="text-foreground">First Sign up:</strong>{" "}
                      <a
                        href="https://login.shadowrunfps.com/signup.srf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        login.shadowrunfps.com/signup.srf
                      </a>
                    </li>
                    <li className="transition-all duration-200 hover:text-foreground">
                      <strong className="text-foreground">
                        Create your gamertag:
                      </strong>{" "}
                      <a
                        href="http://xbox.shadowrunfps.com:8090/NewGamertag.srf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline break-all"
                      >
                        xbox.shadowrunfps.com:8090/NewGamertag.srf
                      </a>
                    </li>
                  </ol>
                  <p className="mt-2">
                    You don&apos;t need a real email — only one you can use to
                    sign in.
                  </p>
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">Launch & sign in:</strong>{" "}
                  Start Shadowrun and sign in with your new AHL email and
                  password. For offline play or bots only, choose a{" "}
                  <strong className="text-foreground">Local Profile</strong>{" "}
                  instead — no AHL account needed.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">Classic Xbox GFWL:</strong>{" "}
                  Use the launcher setting to switch to standard Games for Windows
                  LIVE and sign in with your Microsoft / Xbox account. For manual
                  installs without the toggle, edit{" "}
                  <span className="font-mono text-[0.85rem] text-foreground">
                    patcher_conf.ini
                  </span>{" "}
                  — see the{" "}
                  <a
                    href="/docs/install#ant-hill-live"
                    className="text-primary hover:underline"
                  >
                    install guide
                  </a>
                  . Classic GFWL may still prompt for activation or a key — follow
                  on-screen prompts if so.
                </li>
                <li className="transition-all duration-200 hover:text-foreground">
                  <strong className="text-foreground">Finish & play:</strong>{" "}
                  Close Shadowrun completely if you changed launcher or profile
                  settings, then launch again. You&apos;re ready to play on AHL
                  without an Activate Game step.
                </li>
              </ol>
              <br />
              <p className="text-sm text-muted-foreground">
                <strong>Dedicated server:</strong> In-game, go to Public Matches →
                Dedicated Servers → the Find All tab, and look for{" "}
                <strong className="text-foreground">Shadowrun Official Server</strong>
                .
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                <strong>Note (classic GFWL only):</strong> If you switch to
                standard Xbox Games for Windows LIVE and use activation or a
                retail key, that flow can occasionally need repeating — follow
                any on-screen prompts or see the{" "}
                <a
                  href="/docs/install#game-key"
                  className="text-primary hover:underline"
                >
                  game key section
                </a>
                . AntHill LIVE does not use Activate Game.
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

          {/* Launcher log — support */}
          <div
            id="launcher-logs"
            className="scroll-mt-28 px-2 py-4 mb-5 rounded-xl bg-card/50 sm:p-6 sm:mb-8"
          >
            <div className="flex items-center mb-3 sm:mb-4">
              <FileText className="mr-2 w-5 h-5 shrink-0 text-primary" />
              <h2 className="text-lg font-bold sm:text-xl">
                Launcher logs (troubleshooting)
              </h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground sm:text-base">
              Having issues with the launcher? Copy the path below, paste it into
              Windows File Explorer&apos;s address bar, then press Enter to open{" "}
              <span className="font-medium text-foreground">main.log</span>. Share
              that file when asking for help (for example on Discord).
            </p>
            <div className="flex flex-col gap-3 rounded-lg border border-border/60 bg-background/50 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4">
              <code className="min-w-0 flex-1 break-all font-mono text-xs leading-relaxed text-foreground sm:text-sm">
                {LAUNCHER_MAIN_LOG_PATH}
              </code>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={copyLauncherLogPath}
                className="w-full shrink-0 gap-2 sm:w-auto min-h-[44px] sm:min-h-9"
                aria-label="Copy launcher log path"
              >
                {copiedLogPath ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" aria-hidden />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" aria-hidden />
                    Copy path
                  </>
                )}
              </Button>
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
                fileUrl={LAUNCHER_VIRUSTOTAL_URL}
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
                <span className="text-xs text-muted-foreground sm:text-sm">
                  Last VirusTotal scan:
                </span>
                <span className="font-semibold tabular-nums">
                  v{LAUNCHER_VIRUSTOTAL_SCAN_VERSION}
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
                    {LAUNCHER_INSTALLER_SHA256}
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
