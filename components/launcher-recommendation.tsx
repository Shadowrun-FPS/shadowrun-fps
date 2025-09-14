"use client";

import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

// Feature flag check
const ENABLE_DOWNLOAD_PAGE =
  process.env.NEXT_PUBLIC_ENABLE_DOWNLOAD_PAGE === "true";

export default function LauncherRecommendation() {
  // Only show the launcher recommendation if the download page is enabled
  if (!ENABLE_DOWNLOAD_PAGE) {
    return null;
  }

  return (
    <Alert className="border-blue-500/30 bg-blue-500/10">
      <InfoIcon className="w-4 h-4 text-blue-500" />
      <AlertTitle className="text-blue-700 dark:text-blue-300">
        Recommended: Use Our Launcher
      </AlertTitle>
      <AlertDescription className="text-blue-600 dark:text-blue-400">
        For the smoothest installation experience, we recommend using our{" "}
        <Link
          href="/download"
          className="font-medium underline hover:no-underline"
        >
          custom launcher
        </Link>
        . It automates most of the setup process and handles key generation
        automatically. This manual guide is provided for advanced users or those
        who prefer manual installation.
      </AlertDescription>
    </Alert>
  );
}
