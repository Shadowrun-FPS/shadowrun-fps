"use client";

import { AlertCircle, Image as LibraryIcon, ImagePlus, Loader2, Trash2, UploadCloud } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaLibraryDialog } from "@/components/posts/media-library-dialog";
import { PostCoverImage } from "@/components/posts/post-cover-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  POST_IMAGE_ACCEPT,
  uploadPostImage,
  validatePostImageFile,
} from "@/lib/post-media-client";
import { normalizeImageUrl } from "@/lib/post-display";
import { cn } from "@/lib/utils";

const PREVIEW_DEBOUNCE_MS = 800;

interface CoverImageFieldProps {
  value: string;
  onChange: (imageUrl: string) => void;
  /** Called with the public URL after a file upload finishes, so unused uploads can be cleaned up. */
  onUploaded?: (imageUrl: string) => void;
  /** Validation message from the form. */
  error?: string;
  disabled?: boolean;
}

/** Cover image control: drop or choose a file, or paste an image URL. */
export function CoverImageField({
  value,
  onChange,
  onUploaded,
  error,
  disabled = false,
}: CoverImageFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState(value);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Typed URLs preview after a pause so each keystroke does not fetch an image.
  useEffect(() => {
    const timer = setTimeout(() => {
      setPreviewUrl(normalizeImageUrl(value));
      setPreviewFailed(false);
    }, PREVIEW_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [value]);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) return;

      const validationMessage = validatePostImageFile(file);
      if (validationMessage) {
        setUploadError(validationMessage);
        return;
      }

      setUploadError(null);
      setUploadPercent(0);
      setIsUploading(true);
      try {
        const url = await uploadPostImage(file, setUploadPercent);
        onUploaded?.(url);
        onChange(url);
        // Uploaded files preview right away.
        setPreviewUrl(url);
        setPreviewFailed(false);
      } catch (uploadFailure) {
        setUploadError(
          uploadFailure instanceof Error
            ? uploadFailure.message
            : "The image could not be uploaded."
        );
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [disabled, onChange, onUploaded]
  );

  const hasPreview = Boolean(previewUrl) && !previewFailed;
  const message = uploadError || error;

  return (
    <div className="space-y-3">
      <Label className="flex items-center gap-2 text-sm font-medium sm:text-base">
        <ImagePlus className="h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5" />
        Cover image <span className="text-destructive">*</span>
      </Label>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          void handleFile(event.dataTransfer.files?.[0]);
        }}
        className={cn(
          "relative overflow-hidden rounded-lg border-2 border-dashed transition-colors",
          isDragging ? "border-primary bg-primary/5" : "border-border",
          (error || uploadError) && "border-destructive/60"
        )}
      >
        {hasPreview ? (
          <div className="relative aspect-video w-full bg-muted">
            <PostCoverImage
              key={previewUrl}
              imageUrl={previewUrl}
              alt="Cover image preview"
              sizes="320px"
              fallback={false}
              onLoadError={() => setPreviewFailed(true)}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isUploading}
            className="flex aspect-video w-full flex-col items-center justify-center gap-2 px-4 text-center text-muted-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed touch-manipulation"
          >
            <UploadCloud className="h-8 w-8" aria-hidden="true" />
            <span className="text-sm font-medium text-foreground">
              Drop an image here or choose a file
            </span>
            <span className="text-xs">JPEG, PNG, WebP, or GIF up to 4MB</span>
          </button>
        )}

        {isUploading ? (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/85 px-6"
            role="status"
            aria-live="polite"
          >
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="h-2 w-full max-w-[220px] overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-[width] duration-200"
                style={{ width: `${uploadPercent}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Uploading {uploadPercent}%
            </span>
          </div>
        ) : null}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={POST_IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-label="Upload cover image"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      {/* The empty drop zone is already the file picker, so "Replace image" only appears once an image is set. */}
      <div className="flex flex-wrap gap-2">
        {value ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="mr-2 h-4 w-4" />
            Replace image
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || isUploading}
          onClick={() => setIsLibraryOpen(true)}
        >
          <LibraryIcon className="mr-2 h-4 w-4" />
          Choose from library
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => {
              onChange("");
              setUploadError(null);
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        ) : null}
      </div>

      <MediaLibraryDialog
        open={isLibraryOpen}
        onOpenChange={setIsLibraryOpen}
        selectedUrl={value}
        onSelect={(imageUrl) => {
          setUploadError(null);
          onChange(imageUrl);
        }}
      />

      <div className="space-y-1.5">
        <Label htmlFor="imageUrl" className="text-xs text-muted-foreground">
          Or paste an image URL
        </Label>
        <Input
          id="imageUrl"
          name="imageUrl"
          value={value}
          onChange={(event) => {
            setUploadError(null);
            onChange(event.target.value);
          }}
          disabled={disabled || isUploading}
          placeholder="https://example.com/image.jpg"
          maxLength={500}
          className="min-h-[44px] border-2 text-base sm:min-h-[40px] sm:text-sm"
        />
      </div>

      {previewFailed && value ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          Failed to load image. Check the URL.
        </p>
      ) : null}
      {message ? (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {message}
        </p>
      ) : null}
    </div>
  );
}
