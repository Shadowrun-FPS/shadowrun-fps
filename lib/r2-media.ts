/**
 * Public media storage for post cover images.
 *
 * Launcher builds live in a private R2 bucket (see r2-client.ts). Post images
 * need a public URL, so they go to a separate bucket (`R2_MEDIA_BUCKET_NAME`)
 * served from `R2_PUBLIC_BASE_URL`.
 */

import {
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import { getR2Client } from "@/lib/r2-client";
import { safeLog } from "@/lib/security";
import type { PostMediaLibraryImage } from "@/types";

export const MAX_POST_IMAGE_BYTES = 4 * 1024 * 1024;

const POST_IMAGE_KEY_PATTERN = /^posts\/[0-9a-f-]{36}\.(jpg|png|webp|gif)$/;

export interface DetectedImageType {
  contentType: string;
  extension: "jpg" | "png" | "webp" | "gif";
}

/** Identifies JPEG, PNG, WebP, and GIF from the file's leading bytes. */
export function detectImageType(bytes: Uint8Array): DetectedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }

  const startsWith = (offset: number, text: string) =>
    bytes.length >= offset + text.length &&
    text.split("").every((char, index) => bytes[offset + index] === char.charCodeAt(0));

  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    startsWith(1, "PNG") &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { contentType: "image/png", extension: "png" };
  }

  if (startsWith(0, "GIF87a") || startsWith(0, "GIF89a")) {
    return { contentType: "image/gif", extension: "gif" };
  }

  if (startsWith(0, "RIFF") && startsWith(8, "WEBP")) {
    return { contentType: "image/webp", extension: "webp" };
  }

  return null;
}

function getPublicBaseUrl(): string {
  return (process.env.R2_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
}

export function isMediaStorageConfigured(): boolean {
  return Boolean(
    process.env.R2_MEDIA_BUCKET_NAME &&
      getPublicBaseUrl() &&
      process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY
  );
}

export async function uploadPostImage(
  bytes: Uint8Array,
  type: DetectedImageType
): Promise<string> {
  const key = `posts/${randomUUID()}.${type.extension}`;

  await getR2Client().send(
    new PutObjectCommand({
      Bucket: process.env.R2_MEDIA_BUCKET_NAME,
      Key: key,
      Body: bytes,
      ContentType: type.contentType,
      // Every upload gets a unique key, so a replaced image is a new URL.
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return `${getPublicBaseUrl()}/${key}`;
}

/** Object key for an image this app uploaded, or null for any other URL. */
function getPostImageKey(imageUrl: string): string | null {
  const baseUrl = getPublicBaseUrl();
  if (!baseUrl || !imageUrl.startsWith(`${baseUrl}/`)) return null;

  const key = imageUrl.slice(baseUrl.length + 1).split(/[?#]/)[0];
  return POST_IMAGE_KEY_PATTERN.test(key) ? key : null;
}

// The library shows the newest images. A page holds up to 1000 keys.
const MAX_LIBRARY_IMAGES = 120;
const MAX_LIBRARY_LIST_PAGES = 5;

/** Uploaded cover images, newest first, for the composer's image library. */
export async function listPostImages(): Promise<PostMediaLibraryImage[]> {
  const baseUrl = getPublicBaseUrl();
  const images: PostMediaLibraryImage[] = [];
  let continuationToken: string | undefined;

  for (let page = 0; page < MAX_LIBRARY_LIST_PAGES; page += 1) {
    const response = await getR2Client().send(
      new ListObjectsV2Command({
        Bucket: process.env.R2_MEDIA_BUCKET_NAME,
        Prefix: "posts/",
        ContinuationToken: continuationToken,
      })
    );

    for (const object of response.Contents ?? []) {
      if (!object.Key || !POST_IMAGE_KEY_PATTERN.test(object.Key)) continue;
      images.push({
        url: `${baseUrl}/${object.Key}`,
        uploadedAt: object.LastModified?.toISOString() ?? "",
      });
    }

    if (!response.IsTruncated || !response.NextContinuationToken) break;
    continuationToken = response.NextContinuationToken;
  }

  return images
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .slice(0, MAX_LIBRARY_IMAGES);
}

/** True for a cover image this app uploaded to the media bucket. */
export function isUploadedPostImageUrl(imageUrl: string): boolean {
  return getPostImageKey(imageUrl) !== null;
}

/** Deletes an uploaded cover. Pasted URLs on other hosts are left alone. */
export async function deletePostImageByUrl(imageUrl: string | undefined | null) {
  if (!imageUrl || !isMediaStorageConfigured()) return;

  const key = getPostImageKey(imageUrl);
  if (!key) return;

  try {
    await getR2Client().send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_MEDIA_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    safeLog.error("Failed to delete post image:", error);
  }
}
