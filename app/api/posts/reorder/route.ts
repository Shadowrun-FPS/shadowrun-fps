import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";
import { queryCache } from "@/lib/query-cache";
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

// POST reorder posts - supports both single and bulk reordering
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

  const body = await req.json();

  // Support both bulk reordering (array of posts) and single reordering (backward compatibility)
  if (Array.isArray(body.posts)) {
    // Bulk reordering
    const { posts: reorderedPosts } = body;

    if (!Array.isArray(reorderedPosts) || reorderedPosts.length === 0) {
      throw createError.badRequest("Posts array is required and must not be empty");
    }

    // Validate all posts have _id and order
    for (const post of reorderedPosts) {
      if (!post._id || typeof post.order !== "number") {
        throw createError.badRequest("Each post must have _id and order");
      }
      if (!ObjectId.isValid(post._id)) {
        throw createError.badRequest(`Invalid post ID: ${post._id}`);
      }
    }

    // Batch update all posts using bulkWrite
    const bulkOps = reorderedPosts.map((post) => ({
      updateOne: {
        filter: { _id: new ObjectId(post._id) },
        update: {
          $set: {
            order: post.order,
            updatedAt: new Date(),
          },
        },
      },
    }));

    const result = await db.collection("Posts").bulkWrite(bulkOps);

    // Invalidate cache and revalidate paths
    queryCache.invalidate("posts:all");
    revalidatePath("/");
    revalidatePath("/docs");
    revalidatePath("/docs/events");

    secureLogger.info("Posts bulk reordered successfully", {
      postCount: reorderedPosts.length,
      modifiedCount: result.modifiedCount,
      adminId: session.user.id,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully updated order for ${result.modifiedCount} posts`,
      modifiedCount: result.modifiedCount,
    });
  } else {
    // Single reordering (backward compatibility)
    const { postId, newIndex } = body;

    if (!postId || typeof newIndex !== "number") {
      throw createError.badRequest("Post ID and new index are required");
    }

    // Get all posts sorted by date then order (matching the display sort)
    const posts = await db
      .collection("Posts")
      .find({})
      .sort({ date: 1, order: 1, datePublished: 1 })
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
        update: { $set: { order: index, updatedAt: new Date() } },
      },
    }));

    await db.collection("Posts").bulkWrite(bulkOps);

    // Invalidate cache and revalidate paths
    queryCache.invalidate("posts:all");
    revalidatePath("/");
    revalidatePath("/docs");
    revalidatePath("/docs/events");

    secureLogger.info("Post reordered successfully", {
      postId,
      newIndex,
      adminId: session.user.id,
    });

    return NextResponse.json({ success: true });
  }
});
