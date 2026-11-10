import type { PostMediaLibraryImage, PostMediaUploadResult } from "@/types";

export const POST_IMAGE_MAX_BYTES = 4 * 1024 * 1024;
export const POST_IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

const ACCEPTED_IMAGE_TYPES = POST_IMAGE_ACCEPT.split(",");

/** Returns a message when the file cannot be uploaded, otherwise null. */
export function validatePostImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return "Upload a JPEG, PNG, WebP, or GIF image.";
  }
  if (file.size > POST_IMAGE_MAX_BYTES) {
    return "Images must be 4MB or smaller.";
  }
  return null;
}

/** Loads the images already in the media bucket, newest first. */
export async function fetchPostMediaLibrary(): Promise<PostMediaLibraryImage[]> {
  const response = await fetch("/api/posts/media", { cache: "no-store" });
  const body = (await response.json().catch(() => null)) as {
    images?: PostMediaLibraryImage[];
    error?: string;
  } | null;

  if (!response.ok || !body?.images) {
    throw new Error(body?.error || "The image library could not be loaded.");
  }
  return body.images;
}

/**
 * Deletes uploaded images that no post uses. Fire and forget: `keepalive` lets the
 * request finish while the tab is closing, and a failure only leaves an unused file.
 */
export function discardPostImages(urls: string[]): void {
  if (urls.length === 0) return;
  void fetch("/api/posts/media", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ urls }),
    keepalive: true,
  }).catch(() => undefined);
}

/** Uploads a cover image and reports progress (0-100) as the bytes are sent. */
export function uploadPostImage(
  file: File,
  onProgress: (percent: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", "/api/posts/media");
    request.responseType = "json";

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      const body = request.response as
        | (Partial<PostMediaUploadResult> & { error?: string })
        | null;

      if (request.status >= 200 && request.status < 300 && body?.url) {
        resolve(body.url);
        return;
      }
      reject(new Error(body?.error || "The image could not be uploaded."));
    };

    request.onerror = () =>
      reject(new Error("The image could not be uploaded. Check your connection."));

    const formData = new FormData();
    formData.append("file", file);
    request.send(formData);
  });
}
