import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";

// Helper function to check if user is admin
async function isUserAdmin(userId: string) {
  // Developer ID always has access
  if (userId === SECURITY_CONFIG.DEVELOPER_ID) return true;

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  // Check if user has admin roles in the database
  const user = await db.collection("Players").findOne({ discordId: userId });
  if (!user) return false;

  // Check for admin roles using security config
  return hasAdminRole(user.roles || []);
}

// DELETE post
export const DELETE = withErrorHandling(
  async (req: NextRequest, { params }: { params: { postId: string } }) => {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      throw createError.unauthorized("Authentication required to delete posts");
    }

    // Check if user is admin
    const admin = await isUserAdmin(session.user.id);
    if (!admin) {
      secureLogger.warn("Unauthorized attempt to delete post", {
        userId: session.user.id,
        postId: params.postId,
      });
      throw createError.forbidden("Only admins can delete posts");
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Delete the post
    const result = await db.collection("Posts").deleteOne({
      _id: new ObjectId(params.postId),
    });

    if (result.deletedCount === 0) {
      throw createError.notFound("Post not found");
    }

    secureLogger.info("Post deleted successfully", {
      postId: params.postId,
      adminId: session.user.id,
    });

    return NextResponse.json({ success: true });
  }
);
