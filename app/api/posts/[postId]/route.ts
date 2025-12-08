import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

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

async function deletePostHandler(
  req: NextRequest,
  { params }: { params: { postId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required to delete posts" },
      { status: 401 }
    );
  }

  const admin = await isUserAdmin(session.user.id);
  if (!admin) {
    secureLogger.warn("Unauthorized attempt to delete post", {
      userId: session.user.id,
      postId: params.postId,
    });
    return NextResponse.json(
      { error: "Only admins can delete posts" },
      { status: 403 }
    );
  }

  const postId = sanitizeString(params.postId, 50);
  if (!ObjectId.isValid(postId)) {
    return NextResponse.json(
      { error: "Invalid post ID" },
      { status: 400 }
    );
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result = await db.collection("Posts").deleteOne({
    _id: new ObjectId(postId),
  });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 }
    );
  }

  secureLogger.info("Post deleted successfully", {
    postId,
    adminId: session.user.id,
  });

  revalidatePath("/");
  revalidatePath("/docs");
  revalidatePath(`/docs/${postId}`);

  return NextResponse.json({ success: true });
}

export const DELETE = withApiSecurity(deletePostHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/", "/docs"],
});
