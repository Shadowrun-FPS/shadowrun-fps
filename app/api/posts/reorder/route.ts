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

// POST reorder posts
export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw createError.unauthorized("Authentication required to reorder posts");
  }

  // Check if user is admin
  const admin = await isUserAdmin(session.user.id);
  if (!admin) {
    secureLogger.warn("Unauthorized attempt to reorder posts", {
      userId: session.user.id,
    });
    throw createError.forbidden("Only admins can reorder posts");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const { postId, newIndex } = await req.json();

  if (!postId || typeof newIndex !== "number") {
    throw createError.badRequest("Post ID and new index are required");
  }

  // Get all posts sorted by order
  const posts = await db
    .collection("Posts")
    .find({})
    .sort({ order: 1 })
    .toArray();

  // Find the post to move
  const currentIndex = posts.findIndex(
    (post) => post._id.toString() === postId
  );
  if (currentIndex === -1) {
    throw createError.notFound("Post not found");
  }

  // Reorder the posts
  const [movedPost] = posts.splice(currentIndex, 1);
  posts.splice(newIndex, 0, movedPost);

  // Update all post orders
  const bulkOps = posts.map((post, index) => ({
    updateOne: {
      filter: { _id: post._id },
      update: { $set: { order: index } },
    },
  }));

  await db.collection("Posts").bulkWrite(bulkOps);

  secureLogger.info("Posts reordered successfully", {
    postId,
    newIndex,
    adminId: session.user.id,
  });

  return NextResponse.json({ success: true });
});
