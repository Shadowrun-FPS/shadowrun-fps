import { NextRequest, NextResponse } from "next/server";
import { getDiscordUserInfoBatch } from "@/lib/discord-user-info";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    if (!idsParam) {
      return NextResponse.json(
        { error: "Discord IDs are required" },
        { status: 400 }
      );
    }

    const discordIds = idsParam.split(",").filter((id) => id.trim().length > 0);

    if (discordIds.length === 0) {
      return NextResponse.json([]);
    }

    // Fetch Discord user info for all IDs
    const userInfoMap = await getDiscordUserInfoBatch(discordIds);

    // Convert map to array format
    const result = Array.from(userInfoMap.entries()).map(([discordId, info]) => ({
      discordId,
      ...info,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching Discord user info batch:", error);
    return NextResponse.json(
      { error: "Failed to fetch Discord user info" },
      { status: 500 }
    );
  }
}

