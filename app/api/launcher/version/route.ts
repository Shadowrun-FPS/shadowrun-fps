import { NextResponse } from "next/server";
import { queryCache } from "@/lib/query-cache";
import { safeLog } from "@/lib/security";

export const dynamic = "force-dynamic";

interface LauncherVersion {
  version: string;
  path: string;
  size: number;
  releaseDate: string;
}

// Hardcoded fallback version (last resort)
const FALLBACK_VERSION: LauncherVersion = {
  version: "0.9.92",
  path: "Shadowrun FPS Launcher Setup 0.9.92.exe",
  size: 83436397,
  releaseDate: new Date().toISOString(),
};

// Cache key for in-memory cache
const MEMORY_CACHE_KEY = "launcher:version:latest";

/**
 * Parse YAML content and extract version info
 */
function parseYamlVersionInfo(text: string): LauncherVersion {
  const lines = text.split("\n");
  const versionLine = lines.find((line) =>
    line.trim().startsWith("version:")
  );
  const pathLine = lines.find((line) => line.trim().startsWith("path:"));
  const sizeLine = lines.find((line) => line.trim().startsWith("size:"));
  const dateLine = lines.find((line) =>
    line.trim().startsWith("releaseDate:")
  );

  if (!versionLine || !pathLine) {
    throw new Error("Invalid YAML format");
  }

  return {
    version: versionLine.split(":")[1].trim().replace(/['"]/g, ""),
    path: pathLine.split(":")[1].trim().replace(/['"]/g, ""),
    size: sizeLine ? parseInt(sizeLine.split(":")[1].trim()) : 0,
    releaseDate: dateLine
      ? dateLine.split(":").slice(1).join(":").trim().replace(/['"]/g, "")
      : new Date().toISOString(),
  };
}

/**
 * Fetch version from remote server
 */
async function fetchVersionFromServer(): Promise<LauncherVersion> {
  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch(
      "http://157.245.214.234/launcher/latest.yml",
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();
    return parseYamlVersionInfo(text);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError") {
      throw new Error("Request timeout");
    }
    throw error;
  }
}

export async function GET() {
  try {
    // Layer 1: Try to fetch from remote server (fresh data)
    try {
      const versionInfo = await fetchVersionFromServer();

      // Success! Cache in memory for 10 minutes
      queryCache.set(MEMORY_CACHE_KEY, versionInfo, 10 * 60 * 1000);

      return NextResponse.json(versionInfo, {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      });
    } catch (fetchError) {
      safeLog.error("Failed to fetch from server, trying cache:", fetchError);

      // Layer 2: Try in-memory cache (fast, survives for 10 minutes)
      const memoryCached = queryCache.get<LauncherVersion>(MEMORY_CACHE_KEY);
      if (memoryCached) {
        safeLog.log("Using in-memory cached version");
        return NextResponse.json(memoryCached, {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        });
      }

      // Layer 3: Hardcoded fallback (last resort)
      // Note: If server is down, users can't download anyway, but at least they see a version
      safeLog.log("Using hardcoded fallback version");
      return NextResponse.json(FALLBACK_VERSION, {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      });
    }
  } catch (error) {
    safeLog.error("Unexpected error in launcher version route:", error);

    // Final fallback
    return NextResponse.json(FALLBACK_VERSION, {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  }
}

