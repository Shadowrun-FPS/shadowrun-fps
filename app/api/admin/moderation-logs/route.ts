import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import {
  SECURITY_CONFIG,
  hasAdminRole,
  hasModeratorRole,
} from "@/lib/security-config";
import { safeLog } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import {
  computeActiveBansFromBanUnbanRows,
  getActiveBanDocuments,
} from "@/lib/compute-moderation-stats";
import { enrichAdminModerationLogs } from "@/lib/enrich-admin-moderation-logs";

export const dynamic = "force-dynamic";

const CACHE_HEADERS = {
  "Cache-Control": "private, no-cache, no-store, must-revalidate",
} as const;

async function getModerationLogsHandler(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const DEVELOPER_DISCORD_ID = "238329746671271936";
  const isDeveloper =
    session.user.id === SECURITY_CONFIG.DEVELOPER_ID ||
    session.user.id === DEVELOPER_DISCORD_ID;

  const userRoles = session.user.roles || [];
  const userHasAdminRole = hasAdminRole(userRoles);
  const userHasModeratorRole = hasModeratorRole(userRoles);
  const isAdminUser = session.user.isAdmin;

  const isAuthorized =
    isDeveloper || isAdminUser || userHasAdminRole || userHasModeratorRole;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { db } = await connectToDatabase();
    const col = db.collection("moderation_logs");
    const { searchParams } = new URL(request.url);

    const metaOnly =
      searchParams.get("metaOnly") === "1" ||
      searchParams.get("metaOnly") === "true";

    let limit = Number.parseInt(searchParams.get("limit") ?? "3000", 10);
    if (!Number.isFinite(limit) || limit < 1) {
      limit = 3000;
    }
    limit = Math.min(limit, 5000);

    let skip = Number.parseInt(searchParams.get("skip") ?? "0", 10);
    if (!Number.isFinite(skip) || skip < 0) {
      skip = 0;
    }

    const [totalActions, warnings, banUnbanProjected, pageLogs] =
      await Promise.all([
        col.countDocuments({}),
        col.countDocuments({ action: "warn" }),
        col
          .find({ action: { $in: ["ban", "unban"] } })
          .project({ action: 1, playerId: 1, timestamp: 1, expiry: 1 })
          .sort({ timestamp: -1 })
          .toArray(),
        metaOnly
          ? Promise.resolve([])
          : col
              .find({})
              .sort({ timestamp: -1 })
              .skip(skip)
              .limit(limit)
              .toArray(),
      ]);

    const activeBansCount =
      computeActiveBansFromBanUnbanRows(banUnbanProjected);
    const stats = {
      warnings,
      activeBans: activeBansCount,
      totalActions,
    };

    if (metaOnly) {
      const response = NextResponse.json({ stats });
      Object.entries(CACHE_HEADERS).forEach(([k, v]) =>
        response.headers.set(k, v),
      );
      return response;
    }

    const activeBanStubs = getActiveBanDocuments(banUnbanProjected);
    const activeBanIds = activeBanStubs
      .map((r) => r._id)
      .filter((id): id is ObjectId => id instanceof ObjectId);

    const activeBanFullDocs =
      activeBanIds.length > 0
        ? await col
            .find({ _id: { $in: activeBanIds }, action: "ban" })
            .toArray()
        : [];

    const [enrichedPage, enrichedActiveBans] = await Promise.all([
      enrichAdminModerationLogs(db, pageLogs, banUnbanProjected),
      enrichAdminModerationLogs(db, activeBanFullDocs, banUnbanProjected),
    ]);

    const response = NextResponse.json({
      logs: enrichedPage,
      activeBans: enrichedActiveBans,
      stats,
      total: totalActions,
      limit,
      skip,
    });
    Object.entries(CACHE_HEADERS).forEach(([k, v]) =>
      response.headers.set(k, v),
    );
    return response;
  } catch (err) {
    safeLog.error("admin moderation-logs GET failed", err);
    return NextResponse.json(
      { error: "Failed to load moderation logs" },
      { status: 500 },
    );
  }
}

export const GET = withApiSecurity(getModerationLogsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
});
