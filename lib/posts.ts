import type { Document, ObjectId } from "mongodb";
import { deletePostImageByUrl, isUploadedPostImageUrl } from "@/lib/r2-media";
import clientPromise from "@/lib/mongodb";
import { cachedQuery, queryCache } from "@/lib/query-cache";
import { normalizePostType } from "@/lib/post-display";
import type { Post } from "@/types";

// Bump the suffix when the serialized post shape changes so old cached entries are dropped.
const POSTS_CACHE_KEY = "posts:all:v2";
const POSTS_CACHE_TTL_MS = 5 * 60 * 1000;

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toIsoString(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return "";
}

/** Converts a stored Mongo document into a JSON-safe `Post`, filling in legacy field names. */
export function serializePost(doc: Document): Post {
  const date = toIsoString(doc.date) || toIsoString(doc.createdAt);
  return {
    _id: String(doc._id),
    title: toText(doc.title) || "Untitled",
    description:
      toText(doc.description) || toText(doc.excerpt) || toText(doc.summary),
    imageUrl:
      toText(doc.imageUrl) ||
      toText(doc.image) ||
      toText(doc.thumbnail) ||
      toText(doc.featuredImage),
    type: normalizePostType(doc.type),
    link:
      toText(doc.link) ||
      toText(doc.linkAddress) ||
      toText(doc.url) ||
      toText(doc.externalLink) ||
      toText(doc.href),
    author:
      toText(doc.author) ||
      toText(doc.authorNickname) ||
      toText(doc.creator) ||
      "Unknown",
    authorId: toText(doc.authorId),
    date,
    datePublished: toText(doc.datePublished) || date,
    published: doc.published !== false,
    order: typeof doc.order === "number" ? doc.order : 0,
    updatedAt: toIsoString(doc.updatedAt) || undefined,
  };
}

/** Every post in the order readers see (manual order first). */
export async function getPosts(): Promise<Post[]> {
  return cachedQuery(
    POSTS_CACHE_KEY,
    async () => {
      const client = await clientPromise;
      const documents = await client
        .db("ShadowrunWeb")
        .collection("Posts")
        .find({})
        .sort({ order: 1, date: 1, datePublished: 1 })
        .toArray();
      return documents.map(serializePost);
    },
    POSTS_CACHE_TTL_MS
  );
}

const CALENDAR_DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Reads the date a composer submits. A calendar day (`YYYY-MM-DD`) is stored as
 * that exact day, so it reads the same in every timezone.
 */
export function resolvePostDate(
  value: unknown
): { date: Date; datePublished: string } | null {
  if (typeof value !== "string" || !value) return null;

  if (CALENDAR_DAY_PATTERN.test(value)) {
    const date = new Date(`${value}T00:00:00.000Z`);
    return isNaN(date.getTime()) ? null : { date, datePublished: value };
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : { date, datePublished: date.toISOString() };
}

/** URLs from the list that at least one saved post still uses as its cover. */
export async function findPostImageUrlsInUse(
  imageUrls: string[],
  options: { excludePostId?: ObjectId } = {}
): Promise<Set<string>> {
  if (imageUrls.length === 0) return new Set();

  const client = await clientPromise;
  const posts = await client
    .db("ShadowrunWeb")
    .collection("Posts")
    .find(
      {
        imageUrl: { $in: imageUrls },
        ...(options.excludePostId ? { _id: { $ne: options.excludePostId } } : {}),
      },
      { projection: { imageUrl: 1 } }
    )
    .toArray();
  return new Set(posts.map((post) => post.imageUrl as string));
}

/**
 * Deletes an uploaded cover unless another post reuses it. Covers can be shared
 * through the image library, so removing a post or its cover must check first.
 */
export async function deletePostImageIfUnused(
  imageUrl: string | undefined | null,
  options: { excludePostId?: ObjectId } = {}
) {
  if (!imageUrl || !isUploadedPostImageUrl(imageUrl)) return;

  const inUse = await findPostImageUrlsInUse([imageUrl], options);
  if (inUse.has(imageUrl)) return;

  await deletePostImageByUrl(imageUrl);
}

export function invalidatePostsCache() {
  queryCache.invalidate(POSTS_CACHE_KEY);
}
