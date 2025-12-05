"use client";

import Link from "next/link";
import { Download } from "lucide-react";

// Feature flag check
const ENABLE_DOWNLOAD_PAGE =
  process.env.NEXT_PUBLIC_ENABLE_DOWNLOAD_PAGE === "true";

export default function DownloadButton() {
  const downloadEnabled = ENABLE_DOWNLOAD_PAGE;
  const href = downloadEnabled ? "/download" : "/docs/install";
  const buttonText = downloadEnabled ? "Download Launcher" : "PC Install Guide";

  return (
    <Link
      href={href}
      className="inline-flex overflow-hidden relative items-center px-6 py-3 text-lg font-medium rounded-lg transition-all group bg-primary hover:bg-primary/90"
      aria-label={downloadEnabled ? "Download Shadowrun FPS launcher" : "Go to PC installation guide"}
    >
      <span className="flex relative z-10 items-center text-primary-foreground">
        <Download className="mr-2 w-5 h-5" />
        {buttonText}
      </span>
      <div className="absolute inset-0 bg-gradient-to-r transition-transform duration-300 -z-10 from-primary to-primary/90 group-hover:scale-110" />
      <div className="absolute inset-0 z-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
    </Link>
  );
}
