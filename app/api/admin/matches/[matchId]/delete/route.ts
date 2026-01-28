import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";

export const dynamic = "force-dynamic";

export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: Promise<{ matchId: string }> }) => {
    const { matchId } = await params;
    const session = await getServerSession(authOptions);

    // Check if user is authenticated
    if (!session?.user) {
      throw createError.unauthorized(
        "Authentication required to delete matches"
      );
    }

    // Only allow developer access to this endpoint
    if (session.user.id !== SECURITY_CONFIG.DEVELOPER_ID) {
      secureLogger.warn(
        "Unauthorized access attempt to admin delete endpoint",
        {
          userId: session.user.id,
          matchId: matchId,
        }
      );
      throw createError.forbidden("Access denied");
    }

    secureLogger.info("Admin match deletion initiated", {
      matchId: matchId,
      adminId: session.user.id,
    });

    // Connect to database
    const { db } = await connectToDatabase();

    // Delete the match
    const result = await db.collection("Matches").deleteOne({
      matchId: matchId,
    });

    if (result.deletedCount === 0) {
      throw createError.notFound("Match not found");
    }

    secureLogger.info("Match deleted successfully", {
      matchId: matchId,
      adminId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: "Match deleted successfully",
    });
  }
);
