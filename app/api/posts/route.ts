import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { withErrorHandling, createError } from "@/lib/error-handling";
import { secureLogger } from "@/lib/secure-logger";
import { safeLog, sanitizeString } from "@/lib/security";
import {
  deletePostImageIfUnused,
  getPosts,
  invalidatePostsCache,
  resolvePostDate,
} from "@/lib/posts";
import { withApiSecurity, validateBody } from "@/lib/api-wrapper";
import { revalidatePath } from "next/cache";
import { LEGACY_ARTICLE_TYPE, POST_TYPES, type PostType } from "@/types";

function isHttpUrl(value: string) {
  return /^https?:\/\/\S+$/i.test(value);
}

function isValidImageUrl(value: string) {
  return isHttpUrl(value) || /^\/[^\s/]/.test(value);
}

/** Accepts EVENT or NEWS. The retired ARTICLE type is stored as NEWS. */
function parseSubmittedPostType(value: unknown): PostType {
  const submitted = typeof value === "string" ? sanitizeString(value, 50) : "";
  if (submitted === LEGACY_ARTICLE_TYPE) return "NEWS";
  if (!POST_TYPES.includes(submitted as PostType)) {
    throw createError.badRequest("Type must be EVENT or NEWS");
  }
  return submitted as PostType;
}

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
  const result = await getPosts();

  return NextResponse.json(result, {
    headers: {
      // The events page refetches this after every edit. A public cache was
      // still serving the previous list, so a new post never appeared.
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
    },
  });
}

export const GET = withApiSecurity(getPostsHandler, {
  rateLimiter: "api",
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

  const postType = parseSubmittedPostType(type);

  if (link && !isHttpUrl(link)) {
    throw createError.badRequest("Link must be an http(s) URL");
  }
  if (imageUrl && !isValidImageUrl(imageUrl)) {
    throw createError.badRequest("Image must be an http(s) URL or a site path");
  }

  const earliest = await db
    .collection("Posts")
    .find({})
    .sort({ order: 1 })
    .limit(1)
    .toArray();

  const earliestOrder =
    earliest.length > 0 && typeof earliest[0].order === "number"
      ? earliest[0].order
      : 1;
  const newOrder = earliestOrder - 1;

  // Use the submitted calendar day, otherwise the current moment
  const now = new Date();
  const resolvedDate = resolvePostDate(body.date) ?? {
    date: now,
    datePublished: now.toISOString(),
  };

  const post = {
    title: sanitizeString(title, 200),
    description: description ? sanitizeString(description, 5000) : "",
    type: postType,
    imageUrl: imageUrl ? sanitizeString(imageUrl, 500) : "",
    link: link ? sanitizeString(link, 500) : "",
    authorId: authorId || session.user.id,
    author: author || session.user.name || "",
    date: resolvedDate.date,
    datePublished: resolvedDate.datePublished,
    published: true,
    order: newOrder,
  };

  const result = await db.collection("Posts").insertOne(post);

  secureLogger.info("Post created successfully", {
    postId: result.insertedId,
    authorId: session.user.id,
  });

  // Invalidate cache
  invalidatePostsCache();

  revalidatePath("/");
  revalidatePath("/events");

  return NextResponse.json({
    success: true,
    postId: result.insertedId,
  });
}

export const POST = withApiSecurity(postPostsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/", "/events"],
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
  if (updateData.type) {
    sanitizedUpdate.type = parseSubmittedPostType(updateData.type);
  }
  if (updateData.imageUrl) {
    const imageUrl = sanitizeString(updateData.imageUrl, 500);
    if (!isValidImageUrl(imageUrl)) {
      throw createError.badRequest("Image must be an http(s) URL or a site path");
    }
    sanitizedUpdate.imageUrl = imageUrl;
  }
  // An explicit empty string clears the link. Other optional text keeps its value when omitted.
  if (typeof updateData.link === "string") {
    const link = sanitizeString(updateData.link, 500);
    if (link && !isHttpUrl(link)) {
      throw createError.badRequest("Link must be an http(s) URL");
    }
    sanitizedUpdate.link = link;
  }
  if (updateData.author) sanitizedUpdate.author = sanitizeString(updateData.author, 100);
  if (updateData.order !== undefined) sanitizedUpdate.order = updateData.order;
  if (updateData.published !== undefined) sanitizedUpdate.published = updateData.published;

  // Handle date update
  const resolvedDate = resolvePostDate(updateData.date);
  if (resolvedDate) {
    sanitizedUpdate.date = resolvedDate.date;
    sanitizedUpdate.datePublished = resolvedDate.datePublished;
  }

  const postsCollection = db.collection("Posts");
  const previousPost = await postsCollection.findOne(
    { _id: new ObjectId(_id) },
    { projection: { imageUrl: 1 } }
  );

  await postsCollection.updateOne(
    { _id: new ObjectId(_id) },
    { $set: sanitizedUpdate }
  );

  // A replaced upload is removed unless another post reuses it from the image library.
  if (
    previousPost?.imageUrl &&
    sanitizedUpdate.imageUrl !== undefined &&
    sanitizedUpdate.imageUrl !== previousPost.imageUrl
  ) {
    await deletePostImageIfUnused(previousPost.imageUrl, {
      excludePostId: new ObjectId(_id),
    });
  }

  secureLogger.info("Post updated successfully", {
    postId: _id,
    adminId: session.user.id,
  });

  invalidatePostsCache();

  revalidatePath("/");
  revalidatePath("/events");

  return NextResponse.json({ success: true });
}

export const PUT = withApiSecurity(putPostsHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  requireAdmin: true,
  revalidatePaths: ["/", "/events"],
});
