import { NextResponse } from "next/server";
import { compareDottedVersions } from "@/lib/compare-versions";
import { fetchTextFromR2 } from "@/lib/r2-client";
import { safeLog } from "@/lib/security";
import type { LauncherChangelogEntry } from "@/types/launcher";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const text = await fetchTextFromR2("launcher/changelog.json");
    const raw = JSON.parse(text) as Record<string, LauncherChangelogEntry>;
    const entries = Object.values(raw).sort((x, y) =>
      compareDottedVersions(y.version, x.version)
    );

    return NextResponse.json(
      { entries },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    safeLog.error("Failed to fetch launcher changelog from R2:", error);
    return NextResponse.json(
      { error: "Changelog temporarily unavailable." },
      { status: 503 }
    );
  }
}
