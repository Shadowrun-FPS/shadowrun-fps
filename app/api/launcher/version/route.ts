import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Fetch the latest.yml file from the server
    const response = await fetch(
      "http://157.245.214.234/launcher/latest.yml",
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const text = await response.text();

    // Parse YAML manually
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

    const versionInfo = {
      version: versionLine.split(":")[1].trim().replace(/['"]/g, ""),
      path: pathLine.split(":")[1].trim().replace(/['"]/g, ""),
      size: sizeLine ? parseInt(sizeLine.split(":")[1].trim()) : 0,
      releaseDate: dateLine
        ? dateLine.split(":").slice(1).join(":").trim().replace(/['"]/g, "")
        : new Date().toISOString(),
    };

    return NextResponse.json(versionInfo, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("Failed to fetch launcher version:", error);

    // Return fallback version
    return NextResponse.json(
      {
        version: "0.9.4",
        path: "Shadowrun FPS Launcher Setup 0.9.4.exe",
        size: 83436397,
        releaseDate: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

