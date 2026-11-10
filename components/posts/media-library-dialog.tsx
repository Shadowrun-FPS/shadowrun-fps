"use client";

import { AlertCircle, Check, ImageOff, Loader2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { PostCoverImage } from "@/components/posts/post-cover-image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchPostMediaLibrary } from "@/lib/post-media-client";
import { cn } from "@/lib/utils";
import type { PostMediaLibraryImage } from "@/types";

interface MediaLibraryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** URL of the cover currently selected, highlighted in the grid. */
  selectedUrl: string;
  onSelect: (imageUrl: string) => void;
}

/** Grid of images already uploaded, so a cover can be reused instead of uploaded again. */
export function MediaLibraryDialog({
  open,
  onOpenChange,
  selectedUrl,
  onSelect,
}: MediaLibraryDialogProps) {
  const [images, setImages] = useState<PostMediaLibraryImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadImages = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      setImages(await fetchPostMediaLibrary());
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "The image library could not be loaded."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload on every open so new uploads always appear.
  useEffect(() => {
    if (open) void loadImages();
  }, [open, loadImages]);

  const handleSelect = (imageUrl: string) => {
    onSelect(imageUrl);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-3 sm:max-h-[85vh] sm:max-w-3xl sm:p-5">
        <DialogHeader className="pr-10 text-left sm:pr-0">
          <DialogTitle>Image library</DialogTitle>
          <DialogDescription>
            Pick an image you already uploaded. Newest first.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div
            className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground"
            role="status"
          >
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading images...
          </div>
        ) : errorMessage ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errorMessage}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={loadImages}>
              Try again
            </Button>
          </div>
        ) : images.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <ImageOff className="h-8 w-8" aria-hidden="true" />
            <p className="text-sm">No uploaded images yet.</p>
            <p className="text-xs">Upload a cover once and it will show up here.</p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {images.map((image) => {
              const isSelected = image.url === selectedUrl;
              return (
                <li key={image.url}>
                  <button
                    type="button"
                    onClick={() => handleSelect(image.url)}
                    aria-pressed={isSelected}
                    aria-label="Use this image as the cover"
                    className={cn(
                      "group relative block aspect-video w-full overflow-hidden rounded-lg border-2 bg-muted transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isSelected
                        ? "border-primary"
                        : "border-border hover:border-primary/60"
                    )}
                  >
                    <PostCoverImage
                      imageUrl={image.url}
                      alt="Uploaded cover"
                      sizes="(max-width: 640px) 45vw, 220px"
                      fallback={false}
                    />
                    {isSelected ? (
                      <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-4 w-4" aria-hidden="true" />
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}
