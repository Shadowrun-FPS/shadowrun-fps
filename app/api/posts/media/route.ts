import { NextRequest, NextResponse } from "next/server";
import { AppError, createError } from "@/lib/error-handling";
import { withApiSecurity } from "@/lib/api-wrapper";
import { findPostImageUrlsInUse } from "@/lib/posts";
import { canManageContentLive } from "@/lib/content-auth";
import { secureLogger } from "@/lib/secure-logger";
import {
  MAX_POST_IMAGE_BYTES,
  deletePostImageByUrl,
  detectImageType,
  isMediaStorageConfigured,
  isUploadedPostImageUrl,
  listPostImages,
  uploadPostImage,
} from "@/lib/r2-media";

// Multipart framing adds a little to the file itself.
const MAX_REQUEST_BYTES = MAX_POST_IMAGE_BYTES + 256 * 1024;

// POST a cover image for a post. Returns the public URL to store as `imageUrl`.
async function postMediaHandler(req: NextRequest) {
  if (!isMediaStorageConfigured()) {
    throw new AppError(
      "Image uploads are not configured. Paste an image URL instead.",
      503,
      "MEDIA_NOT_CONFIGURED"
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw createError.badRequest("Choose an image file to upload");
  }
  if (file.size === 0) {
    throw createError.badRequest("That file is empty");
  }
  if (file.size > MAX_POST_IMAGE_BYTES) {
    throw createError.badRequest("Images must be 4MB or smaller");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const imageType = detectImageType(bytes);
  if (!imageType) {
    throw createError.badRequest("Upload a JPEG, PNG, WebP, or GIF image");
  }

  const url = await uploadPostImage(bytes, imageType);

  secureLogger.info("Post image uploaded", { size: file.size });

  return NextResponse.json({ url });
}

export const POST = withApiSecurity(postMediaHandler, {
  rateLimiter: "upload",
  requireAuth: true,
  authorize: canManageContentLive,
  maxBodySize: MAX_REQUEST_BYTES,
});

// GET the uploaded images an admin can reuse as a cover.
async function getMediaLibraryHandler() {
  if (!isMediaStorageConfigured()) {
    throw new AppError(
      "Image uploads are not configured.",
      503,
      "MEDIA_NOT_CONFIGURED"
    );
  }

  const images = await listPostImages();
  return NextResponse.json(
    { images },
    // Admin-only data that changes with every upload.
    { headers: { "Cache-Control": "private, no-store" } }
  );
}

export const GET = withApiSecurity(getMediaLibraryHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  authorize: canManageContentLive,
});

// A composer session never uploads more than a handful of images.
const MAX_DISCARD_URLS = 20;

// DELETE uploaded images that were never saved on a post (cancelled or replaced in the composer).
async function deleteMediaHandler(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { urls?: unknown } | null;
  const submittedUrls = body?.urls;

  if (
    !Array.isArray(submittedUrls) ||
    submittedUrls.length === 0 ||
    submittedUrls.length > MAX_DISCARD_URLS ||
    !submittedUrls.every((url) => typeof url === "string")
  ) {
    throw createError.badRequest("Provide the image URLs to discard");
  }

  const uploadedUrls = Array.from(
    new Set((submittedUrls as string[]).filter(isUploadedPostImageUrl))
  );
  if (uploadedUrls.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  // Never delete an image a saved post still uses.
  const inUseUrls = await findPostImageUrlsInUse(uploadedUrls);

  const unusedUrls = uploadedUrls.filter((url) => !inUseUrls.has(url));
  await Promise.all(unusedUrls.map((url) => deletePostImageByUrl(url)));

  return NextResponse.json({ deleted: unusedUrls.length });
}

export const DELETE = withApiSecurity(deleteMediaHandler, {
  rateLimiter: "admin",
  requireAuth: true,
  authorize: canManageContentLive,
});
