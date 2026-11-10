"use client";

import {
  AlertCircle,
  CalendarIcon,
  Edit,
  Eye,
  FileText,
  Link as LinkIcon,
  Loader2,
  PlusCircle,
  Type,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CoverImageField } from "@/components/posts/cover-image-field";
import { PostCard } from "@/components/posts/post-card";
import { PostDatePicker } from "@/components/posts/post-date-picker";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { sanitizeStringClient } from "@/lib/client-utils";
import { getPostDate, isUpcomingPost, toCalendarDay } from "@/lib/post-date";
import { POST_TYPE_META } from "@/lib/post-display";
import {
  POST_LIMITS,
  arePostFormValuesEqual,
  buildPreviewPost,
  getInitialPostFormValues,
  validatePostForm,
  type PostFormErrors,
} from "@/lib/post-form";
import { usePostUploadCleanup } from "@/hooks/usePostUploadCleanup";
import { cn } from "@/lib/utils";
import { POST_TYPES, type Post, type PostFormValues, type PostType } from "@/types";

interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The post being edited. Omit to create a new post. */
  initialData?: Post;
}

const fieldClassName =
  "min-h-[44px] w-full border-2 text-base transition-colors touch-manipulation focus:border-primary/50 sm:min-h-[40px] sm:text-sm";

interface FieldHeaderProps {
  htmlFor: string;
  label: string;
  required?: boolean;
  icon: React.ReactNode;
  count?: { current: number; max: number };
}

function FieldHeader({ htmlFor, label, required, icon, count }: FieldHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <Label
        htmlFor={htmlFor}
        className="flex items-center gap-2 text-sm font-medium sm:text-base"
      >
        {icon}
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {count ? (
        <span
          className={cn(
            "text-xs text-muted-foreground",
            count.current > count.max && "text-destructive"
          )}
        >
          {count.current.toLocaleString()}/{count.max.toLocaleString()}
        </span>
      ) : null}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-destructive">
      <AlertCircle className="h-3 w-3" />
      {message}
    </p>
  );
}

const iconClassName = "h-4 w-4 flex-shrink-0 sm:h-5 sm:w-5";

function noop() {}

export function PostDialog({ open, onOpenChange, initialData }: PostDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();

  const defaultAuthor = session?.user?.nickname || session?.user?.name || "";
  const initialDate = useMemo(
    () => (initialData ? getPostDate(initialData) : undefined) ?? new Date(),
    [initialData]
  );

  const [baseline, setBaseline] = useState<PostFormValues>(() =>
    getInitialPostFormValues(initialData, defaultAuthor)
  );
  const [values, setValues] = useState<PostFormValues>(baseline);
  const [date, setDate] = useState<Date>(initialDate);
  const [errors, setErrors] = useState<PostFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isDiscardPromptOpen, setIsDiscardPromptOpen] = useState(false);

  // The session can finish loading after the dialog opens. Fill the author without counting it as an edit.
  useEffect(() => {
    if (initialData || !defaultAuthor) return;
    setBaseline((current) =>
      current.author ? current : { ...current, author: defaultAuthor }
    );
    setValues((current) =>
      current.author ? current : { ...current, author: defaultAuthor }
    );
  }, [defaultAuthor, initialData]);

  // Deletes uploaded covers that never reach a saved post (cancel, replace, closed tab).
  const { trackUpload, markSaved } = usePostUploadCleanup(values.imageUrl);

  const isDirty =
    !arePostFormValuesEqual(values, baseline) ||
    toCalendarDay(date) !== toCalendarDay(initialDate);

  const updateField = useCallback(
    <Field extends keyof PostFormValues>(
      field: Field,
      value: PostFormValues[Field]
    ) => {
      setValues((current) => ({ ...current, [field]: value }));
      setErrors((current) => {
        if (!current[field]) return current;
        const { [field]: _cleared, ...remaining } = current;
        return remaining;
      });
    },
    []
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && isSaving) return;
      if (!nextOpen && isDirty) {
        setIsDiscardPromptOpen(true);
        return;
      }
      onOpenChange(nextOpen);
    },
    [isDirty, isSaving, onOpenChange]
  );

  const previewPost = useMemo(() => buildPreviewPost(values, date), [values, date]);

  const handleSubmit = async () => {
    if (isSaving) return;

    const validationErrors = validatePostForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) {
      setIsPreviewing(false);
      toast({
        title: "Validation error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/posts", {
        method: initialData ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          _id: initialData?._id,
          title: sanitizeStringClient(values.title, POST_LIMITS.title),
          description: sanitizeStringClient(values.description, POST_LIMITS.description),
          imageUrl: sanitizeStringClient(values.imageUrl, POST_LIMITS.imageUrl),
          type: values.type,
          // An empty link is sent as-is so editing can remove an existing link.
          link: sanitizeStringClient(values.link, POST_LIMITS.link),
          author:
            sanitizeStringClient(values.author, POST_LIMITS.author) ||
            session?.user?.name ||
            "Unknown User",
          authorId: initialData?.authorId || session?.user?.id,
          // A calendar day reads the same in every timezone.
          date: toCalendarDay(date),
          published: true,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error || "Failed to save post");
      }

      toast({
        title: initialData ? "Post updated" : "Post published",
        description: initialData
          ? "Your changes are live."
          : "Your post is now on the events page.",
      });

      // The saved post now owns its cover, so it must not be cleaned up on close.
      markSaved();

      // Reload the server-rendered list so the public page shows the change.
      router.refresh();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error && error.message
            ? error.message
            : "Failed to save post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const previewIsUpcoming = isUpcomingPost(previewPost);

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[calc(100dvh-1rem)] overflow-y-auto p-3 sm:max-h-[90vh] sm:max-w-[960px] sm:p-5 md:p-6">
          <DialogHeader className="space-y-2 border-b border-border/40 pb-3 pr-10 text-left sm:pb-4 sm:pr-0">
            <div className="flex items-start gap-2.5 sm:items-center sm:gap-3">
              <div className="flex-shrink-0 rounded-lg border border-primary/20 bg-primary/10 p-1.5 sm:p-2">
                {initialData ? (
                  <Edit className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                ) : (
                  <PlusCircle className="h-5 w-5 text-primary sm:h-6 sm:w-6" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="break-words text-base font-bold leading-tight sm:text-lg md:text-xl lg:text-2xl">
                  {isPreviewing
                    ? "Preview"
                    : initialData
                      ? "Edit Post"
                      : "Create New Post"}
                </DialogTitle>
                <DialogDescription className="mt-1 break-words text-xs text-muted-foreground sm:text-sm">
                  {isPreviewing
                    ? "This is how readers will see the post."
                    : initialData
                      ? "Update the post details below"
                      : "Fill in the details to publish a community post"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {isPreviewing ? (
            <div
              className="pointer-events-none space-y-6 py-3 sm:py-4"
              aria-label="Post preview"
            >
              <div>
                <PostCard
                  post={previewPost}
                  variant="lead"
                  upcoming={previewIsUpcoming}
                  onOpen={noop}
                />
              </div>
              <div className="max-w-sm">
                <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  In the grid
                </p>
                <PostCard
                  post={previewPost}
                  upcoming={previewIsUpcoming}
                  onOpen={noop}
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-6 py-3 sm:py-4 md:grid-cols-[minmax(0,1fr)_320px] md:gap-8">
              <div className="space-y-4 sm:space-y-5">
                <div className="space-y-2">
                  <FieldHeader
                    htmlFor="title"
                    label="Title"
                    required
                    icon={<FileText className={iconClassName} />}
                    count={{ current: values.title.length, max: POST_LIMITS.title }}
                  />
                  <Input
                    id="title"
                    name="title"
                    value={values.title}
                    onChange={(event) => updateField("title", event.target.value)}
                    placeholder="Enter post title"
                    className={cn(
                      fieldClassName,
                      errors.title && "border-destructive focus:border-destructive"
                    )}
                  />
                  <FieldError message={errors.title} />
                </div>

                <div className="space-y-2">
                  <FieldHeader
                    htmlFor="description"
                    label="Description"
                    required
                    icon={<FileText className={iconClassName} />}
                    count={{
                      current: values.description.length,
                      max: POST_LIMITS.description,
                    }}
                  />
                  <Textarea
                    id="description"
                    name="description"
                    value={values.description}
                    onChange={(event) =>
                      updateField("description", event.target.value)
                    }
                    placeholder="Write the full post. Line breaks are kept."
                    rows={10}
                    className={cn(
                      "min-h-[220px] w-full border-2 text-base transition-colors touch-manipulation focus:border-primary/50 sm:text-sm",
                      errors.description &&
                        "border-destructive focus:border-destructive"
                    )}
                  />
                  <FieldError message={errors.description} />
                </div>

                <div className="space-y-2">
                  <FieldHeader
                    htmlFor="link"
                    label="Link (optional)"
                    icon={<LinkIcon className={iconClassName} />}
                    count={
                      values.link
                        ? { current: values.link.length, max: POST_LIMITS.link }
                        : undefined
                    }
                  />
                  <Input
                    id="link"
                    name="link"
                    value={values.link}
                    onChange={(event) => updateField("link", event.target.value)}
                    placeholder="https://example.com/article"
                    className={cn(
                      fieldClassName,
                      errors.link && "border-destructive focus:border-destructive"
                    )}
                  />
                  <FieldError message={errors.link} />
                  <p className="text-xs text-muted-foreground">
                    With a link, the card opens that page. Without one, readers
                    open the full post here on the site.
                  </p>
                </div>
              </div>

              <div className="space-y-4 sm:space-y-5">
                <CoverImageField
                  value={values.imageUrl}
                  onChange={(imageUrl) => updateField("imageUrl", imageUrl)}
                  onUploaded={trackUpload}
                  error={errors.imageUrl}
                  disabled={isSaving}
                />

                <div className="space-y-2">
                  <FieldHeader
                    htmlFor="type"
                    label="Type"
                    required
                    icon={<Type className={iconClassName} />}
                  />
                  <Select
                    value={values.type}
                    onValueChange={(value) => updateField("type", value as PostType)}
                  >
                    <SelectTrigger
                      id="type"
                      className="min-h-[44px] w-full border-2 text-base touch-manipulation sm:min-h-[40px] sm:text-sm"
                    >
                      <SelectValue placeholder="Select post type" />
                    </SelectTrigger>
                    <SelectContent>
                      {POST_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {POST_TYPE_META[type].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <FieldHeader
                    htmlFor="date"
                    label="Date"
                    icon={<CalendarIcon className={iconClassName} />}
                  />
                  <PostDatePicker id="date" value={date} onChange={setDate} />
                </div>

                <div className="space-y-2">
                  <FieldHeader
                    htmlFor="author"
                    label="Author"
                    required
                    icon={<User className={iconClassName} />}
                    count={{ current: values.author.length, max: POST_LIMITS.author }}
                  />
                  <Input
                    id="author"
                    name="author"
                    value={values.author}
                    onChange={(event) => updateField("author", event.target.value)}
                    placeholder="Author name"
                    className={cn(
                      fieldClassName,
                      errors.author && "border-destructive focus:border-destructive"
                    )}
                  />
                  <FieldError message={errors.author} />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-3 border-t border-border/40 pt-4 sm:flex-row sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSaving}
              className="order-3 min-h-[44px] w-full touch-manipulation text-base sm:order-1 sm:min-h-[40px] sm:w-auto sm:text-sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsPreviewing((current) => !current)}
              disabled={isSaving}
              className="order-2 min-h-[44px] w-full touch-manipulation text-base sm:min-h-[40px] sm:w-auto sm:text-sm"
            >
              {isPreviewing ? (
                <>
                  <Edit className="mr-2 h-4 w-4" />
                  Back to editing
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </>
              )}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="order-1 min-h-[44px] w-full touch-manipulation text-base sm:order-3 sm:min-h-[40px] sm:w-auto sm:text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {initialData ? "Updating..." : "Publishing..."}
                </>
              ) : initialData ? (
                "Update Post"
              ) : (
                "Publish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDiscardPromptOpen}
        onOpenChange={setIsDiscardPromptOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard your changes?</AlertDialogTitle>
            <AlertDialogDescription>
              {initialData
                ? "Your edits to this post have not been saved."
                : "This post has not been published yet."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <AlertDialogCancel className="min-h-[44px] w-full sm:min-h-0 sm:w-auto">
              Keep editing
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsDiscardPromptOpen(false);
                onOpenChange(false);
              }}
              className="min-h-[44px] w-full bg-destructive text-destructive-foreground hover:bg-destructive/90 sm:min-h-0 sm:w-auto"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
