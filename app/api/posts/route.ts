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

// GET all posts
export const GET = withErrorHandling(async (req: NextRequest) => {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  // Get all posts, sorted by order field or date if order doesn't exist
  const posts = await db
    .collection("Posts")
    .find({})
    .sort({ order: 1, date: -1 })
    .toArray();

  return NextResponse.json(posts);
});

// POST new post
export const POST = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw createError.unauthorized("Authentication required to create posts");
  }

  // Check if user is admin
  const admin = await isUserAdmin(session.user.id);
  if (!admin) {
    secureLogger.warn("Unauthorized attempt to create post", {
      userId: session.user.id,
    });
    throw createError.forbidden("Only admins can create posts");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const { title, description, type, imageUrl, link, authorId, author } =
    await req.json();

  // Get the highest order value
  const highestOrder = await db
    .collection("Posts")
    .find({})
    .sort({ order: -1 })
    .limit(1)
    .toArray();

  const newOrder =
    highestOrder.length > 0 ? (highestOrder[0].order || 0) + 1 : 0;

  // Create the post with the author's nickname
  const post = {
    title,
    description,
    type,
    imageUrl,
    link,
    authorId,
    author, // This will now be the Discord nickname
    datePublished: new Date().toISOString(),
    published: true,
  };

  // Create the post
  const result = await db.collection("Posts").insertOne(post);

  secureLogger.info("Post created successfully", {
    postId: result.insertedId,
    authorId: session.user.id,
  });

  return NextResponse.json({
    success: true,
    postId: result.insertedId,
  });
});

// PUT update post
export const PUT = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw createError.unauthorized("Authentication required to update posts");
  }

  // Check if user is admin
  const admin = await isUserAdmin(session.user.id);
  if (!admin) {
    secureLogger.warn("Unauthorized attempt to update post", {
      userId: session.user.id,
    });
    throw createError.forbidden("Only admins can update posts");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const data = await req.json();
  const { _id, ...updateData } = data;

  if (!_id) {
    throw createError.badRequest("Post ID is required");
  }

  // Update the post
  await db.collection("Posts").updateOne(
    { _id: new ObjectId(_id) },
    {
      $set: {
        ...updateData,
        updatedAt: new Date(),
      },
    }
  );

  secureLogger.info("Post updated successfully", {
    postId: _id,
    adminId: session.user.id,
  });

  return NextResponse.json({ success: true });
});
