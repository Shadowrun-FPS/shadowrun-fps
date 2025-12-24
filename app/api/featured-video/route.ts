import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath, revalidateTag } from "next/cache";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";

export const dynamic = 'force-dynamic';

async function getFeaturedVideoHandler() {
  const client = await clientPromise;
  const db = client.db();

  const settings = await db
    .collection("ui_settings")
    .findOne({ component: "featured_video" });

  const response = NextResponse.json(settings?.settings || {
    type: "none",
    youtubeUrl: "",
    twitchChannel: "",
    title: "",
  });
  // Use shorter cache with tag for easy invalidation
  response.headers.set(
    "Cache-Control",
    "public, s-maxage=10, stale-while-revalidate=30"
  );
  // Add cache tag for revalidation
  response.headers.set("Cache-Tag", "featured-video");
  return response;
}

async function updateFeaturedVideoHandler(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin
  const isDeveloper = session.user.id === SECURITY_CONFIG.DEVELOPER_ID;
  const userRoles = session.user.roles || [];
  const userHasAdminRole = hasAdminRole(userRoles);
  const isAdminUser = session.user.isAdmin;

  if (!isDeveloper && !isAdminUser && !userHasAdminRole) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const validation = validateBody(body, {
    type: { type: "string", required: true, maxLength: 20 },
    youtubeUrl: { type: "string", required: false, maxLength: 500 },
    twitchChannel: { type: "string", required: false, maxLength: 100 },
    title: { type: "string", required: false, maxLength: 200 },
  });

  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors?.join(", ") || "Invalid input" },
      { status: 400 }
    );
  }

  const { type, youtubeUrl, twitchChannel, title } = validation.data! as {
    type: string;
    youtubeUrl?: string;
    twitchChannel?: string;
    title?: string;
  };

  // Validate type
  if (!["none", "youtube", "twitch"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid type. Must be 'none', 'youtube', or 'twitch'" },
      { status: 400 }
    );
  }

  // Validate URLs based on type
  if (type === "youtube" && !youtubeUrl) {
    return NextResponse.json(
      { error: "YouTube URL is required when type is 'youtube'" },
      { status: 400 }
    );
  }

  if (type === "twitch" && !twitchChannel) {
    return NextResponse.json(
      { error: "Twitch channel is required when type is 'twitch'" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db();

  const settings = {
    type: sanitizeString(type, 20),
    youtubeUrl: youtubeUrl ? sanitizeString(youtubeUrl, 500) : "",
    twitchChannel: twitchChannel ? sanitizeString(twitchChannel, 100) : "",
    title: title ? sanitizeString(title, 200) : "",
    updatedAt: new Date(),
    updatedBy: session.user.id,
  };

  await db
    .collection("ui_settings")
    .updateOne(
      { component: "featured_video" },
      { $set: { component: "featured_video", settings } },
      { upsert: true }
    );

  // Revalidate all caches
  revalidatePath("/");
  revalidatePath("/admin/featured-video");
  revalidateTag("featured-video");

  return NextResponse.json({ success: true, settings });
}

export const GET = withApiSecurity(getFeaturedVideoHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 10, // Reduced from 60 to 10 seconds for faster updates
});

export const PUT = withApiSecurity(updateFeaturedVideoHandler, {
  rateLimiter: "api",
  cacheable: false,
});

