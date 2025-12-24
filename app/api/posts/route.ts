import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";
import { safeLog, sanitizeString } from "@/lib/security";
import { cachedQuery, queryCache } from "@/lib/query-cache";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
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

// GET all posts
async function getPostsHandler(req: NextRequest) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const result = await cachedQuery(
    "posts:all",
    async () => {
      return await db
        .collection("Posts")
        .find({})
        .sort({ order: 1, date: 1, datePublished: 1 })
        .toArray();
    },
    5 * 60 * 1000 // Cache for 5 minutes
  );

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}

export const GET = withApiSecurity(getPostsHandler, {
  rateLimiter: "api",
  cacheable: true,
  cacheMaxAge: 300,
});

// POST new post
async function postPostsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw createError.unauthorized("Authentication required to create posts");
  }

  const admin = await isUserAdmin(session.user.id);
  if (!admin) {
    secureLogger.warn("Unauthorized attempt to create post", {
      userId: session.user.id,
    });
    throw createError.forbidden("Only admins can create posts");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const body = await req.json();
  const validation = validateBody(body, {
    title: { type: "string", required: true, maxLength: 200 },
    description: { type: "string", required: false, maxLength: 5000 },
    type: { type: "string", required: true },
    imageUrl: { type: "string", required: false, maxLength: 500 },
    link: { type: "string", required: false, maxLength: 500 },
    authorId: { type: "string", required: false },
    author: { type: "string", required: false, maxLength: 100 },
  });

  if (!validation.valid) {
    throw createError.badRequest(validation.errors?.join(", ") || "Invalid input");
  }

  const validationData = validation.data! as {
    title: string;
    description?: string;
    type: string;
    imageUrl?: string;
    link?: string;
    authorId?: string;
    author?: string;
  };
  const { title, description, type, imageUrl, link, authorId, author } = validationData;

  const highestOrder = await db
    .collection("Posts")
    .find({})
    .sort({ order: -1 })
    .limit(1)
    .toArray();

  const newOrder =
    highestOrder.length > 0 ? (highestOrder[0].order || 0) + 1 : 0;

  // Parse date from body if provided, otherwise use current date
  let postDate = new Date();
  if (body.date) {
    try {
      postDate = new Date(body.date);
      // If date is invalid, fall back to current date
      if (isNaN(postDate.getTime())) {
        postDate = new Date();
      }
    } catch {
      postDate = new Date();
    }
  }

  const post = {
    title: sanitizeString(title, 200),
    description: description ? sanitizeString(description, 5000) : "",
    type: sanitizeString(type, 50),
    imageUrl: imageUrl ? sanitizeString(imageUrl, 500) : "",
    link: link ? sanitizeString(link, 500) : "",
    authorId: authorId || session.user.id,
    author: author || session.user.name || "",
    date: postDate,
    datePublished: postDate.toISOString(),
    published: true,
    order: newOrder,
  };

  const result = await db.collection("Posts").insertOne(post);

  secureLogger.info("Post created successfully", {
    postId: result.insertedId,
    authorId: session.user.id,
  });

  // Invalidate cache
  queryCache.invalidate("posts:all");

  revalidatePath("/");
  revalidatePath("/docs");
  revalidatePath("/docs/events");

  return NextResponse.json({
    success: true,
    postId: result.insertedId,
  });
}

export const POST = withApiSecurity(postPostsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/", "/docs"],
});

// PUT update post
async function putPostsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw createError.unauthorized("Authentication required to update posts");
  }

  const admin = await isUserAdmin(session.user.id);
  if (!admin) {
    secureLogger.warn("Unauthorized attempt to update post", {
      userId: session.user.id,
    });
    throw createError.forbidden("Only admins can update posts");
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const body = await req.json();
  const { _id, ...updateData } = body;

  if (!_id || !ObjectId.isValid(_id)) {
    throw createError.badRequest("Valid post ID is required");
  }

  // Sanitize update data
  const sanitizedUpdate: any = {
    updatedAt: new Date(),
  };

  if (updateData.title) sanitizedUpdate.title = sanitizeString(updateData.title, 200);
  if (updateData.description) sanitizedUpdate.description = sanitizeString(updateData.description, 5000);
  if (updateData.type) sanitizedUpdate.type = sanitizeString(updateData.type, 50);
  if (updateData.imageUrl) sanitizedUpdate.imageUrl = sanitizeString(updateData.imageUrl, 500);
  if (updateData.link) sanitizedUpdate.link = sanitizeString(updateData.link, 500);
  if (updateData.author) sanitizedUpdate.author = sanitizeString(updateData.author, 100);
  if (updateData.order !== undefined) sanitizedUpdate.order = updateData.order;
  if (updateData.published !== undefined) sanitizedUpdate.published = updateData.published;
  
  // Handle date update
  if (updateData.date) {
    try {
      const postDate = new Date(updateData.date);
      if (!isNaN(postDate.getTime())) {
        sanitizedUpdate.date = postDate;
        sanitizedUpdate.datePublished = postDate.toISOString();
      }
    } catch {
      // Invalid date, skip update
    }
  }

  await db.collection("Posts").updateOne(
    { _id: new ObjectId(_id) },
    { $set: sanitizedUpdate }
  );

  secureLogger.info("Post updated successfully", {
    postId: _id,
    adminId: session.user.id,
  });

  revalidatePath("/");
  revalidatePath("/docs");
  revalidatePath(`/docs/${_id}`);

  return NextResponse.json({ success: true });
}

export const PUT = withApiSecurity(putPostsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/", "/docs"],
});
