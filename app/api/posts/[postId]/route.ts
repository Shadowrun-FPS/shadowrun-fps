import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { canManageContentLive } from "@/lib/content-auth";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";
import { safeLog, sanitizeString } from "@/lib/security";
import { deletePostImageIfUnused, invalidatePostsCache } from "@/lib/posts";
import { withApiSecurity } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";

async function deletePostHandler(
  req: NextRequest,
  context: { params: Promise<{ postId: string }> | { postId: string } }
) {
  const params = await context.params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { error: "Authentication required to delete posts" },
      { status: 401 }
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

  const postsCollection = db.collection("Posts");
  const post = await postsCollection.findOne(
    { _id: new ObjectId(postId) },
    { projection: { imageUrl: 1 } }
  );

  const result = await postsCollection.deleteOne({
    _id: new ObjectId(postId),
  });

  if (result.deletedCount === 0) {
    return NextResponse.json(
      { error: "Post not found" },
      { status: 404 }
    );
  }

  // Remove the uploaded cover along with its post, unless another post reuses it
  await deletePostImageIfUnused(post?.imageUrl);

  secureLogger.info("Post deleted successfully", {
    postId,
    adminId: session.user.id,
  });

  invalidatePostsCache();

  revalidatePath("/");
  revalidatePath("/events");

  return NextResponse.json({ success: true });
}

export const DELETE = withApiSecurity(deletePostHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  authorize: canManageContentLive,
  revalidatePaths: ["/", "/events"],
});
