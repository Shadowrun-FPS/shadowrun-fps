"use client";

import { useCallback, useEffect, useRef } from "react";
import { discardPostImages } from "@/lib/post-media-client";

/**
 * Tracks images uploaded during one composer session and deletes the ones that
 * never end up on a saved post: replaced or removed covers, a cancelled
 * composer, or a closed tab. Images that were already saved are never tracked.
 */
export function usePostUploadCleanup(currentImageUrl: string) {
  const sessionUploadsRef = useRef<string[]>([]);
  const isActiveRef = useRef(false);

  const discardAll = useCallback(() => {
    const urls = sessionUploadsRef.current;
    sessionUploadsRef.current = [];
    discardPostImages(urls);
  }, []);

  // Records a fresh upload. If the composer closed during the upload, delete it now.
  const trackUpload = useCallback((url: string) => {
    if (!isActiveRef.current) {
      discardPostImages([url]);
      return;
    }
    sessionUploadsRef.current = [...sessionUploadsRef.current, url];
  }, []);

  // After a successful save the final cover belongs to the post, so stop tracking.
  const markSaved = useCallback(() => {
    sessionUploadsRef.current = [];
  }, []);

  // Delete uploads that are no longer the selected cover (replaced, removed, or overwritten by a pasted URL).
  useEffect(() => {
    const replacedUrls = sessionUploadsRef.current.filter(
      (url) => url !== currentImageUrl
    );
    if (replacedUrls.length === 0) return;
    sessionUploadsRef.current = sessionUploadsRef.current.filter(
      (url) => url === currentImageUrl
    );
    discardPostImages(replacedUrls);
  }, [currentImageUrl]);

  // Closing the composer or the tab without saving deletes what is left.
  useEffect(() => {
    isActiveRef.current = true;
    window.addEventListener("pagehide", discardAll);
    return () => {
      isActiveRef.current = false;
      window.removeEventListener("pagehide", discardAll);
      discardAll();
    };
  }, [discardAll]);

  return { trackUpload, markSaved };
}
