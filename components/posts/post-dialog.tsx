"use client";

import { useState, useEffect } from "react";
import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  FileText,
  Image as ImageIcon,
  Link as LinkIcon,
  User,
  Type,
  PlusCircle,
  Edit,
  AlertCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

// Custom Calendar with Year/Month Dropdowns
function CalendarWithDropdowns({
  selected,
  onSelect,
  ...props
}: {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  mode?: "single";
  initialFocus?: boolean;
}) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(
    selected || new Date()
  );

  // Update current month when selected date changes
  React.useEffect(() => {
    if (selected) {
      setCurrentMonth(selected);
    }
  }, [selected]);

  const currentYear = currentMonth.getFullYear();
  const currentMonthIndex = currentMonth.getMonth();

  // Generate years (from 2010 to 10 years in the future)
  const currentYearNum = new Date().getFullYear();
  const years = Array.from({ length: currentYearNum - 2010 + 11 }, (_, i) => 2010 + i);

  // Month names
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleYearChange = (year: string) => {
    const newDate = new Date(currentMonth);
    newDate.setFullYear(parseInt(year));
    setCurrentMonth(newDate);
  };

  const handleMonthChange = (month: string) => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(parseInt(month));
    setCurrentMonth(newDate);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonth(newDate);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    if (onSelect) {
      onSelect(today);
    }
  };

  return (
    <div className="p-3">
      {/* Year and Month Selectors */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 mb-4 pb-3 border-b">
        <div className="flex items-center gap-2 flex-1">
          <Select
            value={currentMonthIndex.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-full sm:w-[140px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-full sm:w-[100px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={goToToday}
            type="button"
            title="Go to today"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToPreviousMonth}
            type="button"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={goToNextMonth}
            type="button"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar */}
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={currentMonth}
        onMonthChange={setCurrentMonth}
        initialFocus={false}
        {...props}
      />
    </div>
  );
}

interface PostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

export function PostDialog({
  open,
  onOpenChange,
  initialData,
}: PostDialogProps) {
  const { data: session } = useSession();
  const { toast } = useToast();
  const router = useRouter();
  // Helper to parse date from various formats
  const parseDate = (dateValue: any): Date | undefined => {
    if (!dateValue) return undefined;
    
    if (dateValue instanceof Date) {
      return dateValue;
    }
    
    if (typeof dateValue === "string") {
      // Handle MM-DD-YYYY format (e.g., "10-17-2023")
      const mmddyyyyMatch = dateValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
      if (mmddyyyyMatch) {
        const [, month, day, year] = mmddyyyyMatch;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      // Try standard Date parsing
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    return undefined;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [date, setDate] = useState<Date | undefined>(
    initialData?.datePublished ? parseDate(initialData.datePublished) :
    initialData?.date ? parseDate(initialData.date) : 
    new Date()
  );

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    imageUrl: initialData?.imageUrl || "",
    type: initialData?.type || "EVENT",
    link: initialData?.link || "",
    author:
      initialData?.author ||
      session?.user?.nickname ||
      session?.user?.name ||
      "",
    authorId: initialData?.authorId || session?.user?.id || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageError, setImageError] = useState(false);
  const [debouncedImageUrl, setDebouncedImageUrl] = useState(initialData?.imageUrl || "");

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (open) {
      const initialImageUrl = initialData?.imageUrl || "";
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || "",
        imageUrl: initialImageUrl,
        type: initialData?.type || "EVENT",
        link: initialData?.link || "",
        author:
          initialData?.author ||
          session?.user?.nickname ||
          session?.user?.name ||
          "",
        authorId: initialData?.authorId || session?.user?.id || "",
      });
      setDebouncedImageUrl(initialImageUrl);
      setDate(
        initialData?.datePublished ? parseDate(initialData.datePublished) :
        initialData?.date ? parseDate(initialData.date) : 
        new Date()
      );
      setErrors({});
      setImageError(false);
    }
  }, [open, initialData, session]);

  // Normalize image URL helper
  const normalizeImageUrl = (url: string): string => {
    if (!url) return "";
    // If it's already an external URL, return as-is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // If it's a local path and doesn't start with /, add it
    if (url && !url.startsWith("/")) {
      return `/${url}`;
    }
    return url;
  };

  // Debounce image URL for preview - increased delay to prevent excessive requests
  useEffect(() => {
    const timer = setTimeout(() => {
      const normalized = normalizeImageUrl(formData.imageUrl);
      setDebouncedImageUrl(normalized);
      setImageError(false);
    }, 800); // Wait 800ms after user stops typing

    return () => clearTimeout(timer);
  }, [formData.imageUrl]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field if it becomes valid
    if (errors[name]) {
      let isValid = true;
      
      if (name === "title") {
        isValid = value.trim().length > 0 && value.length <= 200;
      } else if (name === "description") {
        isValid = value.trim().length > 0 && value.length <= 500;
      } else if (name === "imageUrl") {
        const normalized = normalizeImageUrl(value);
        isValid = value.trim().length > 0 && (
          normalized.match(/^(https?:\/\/.+\..+|^\/.+)$/) !== null
        );
      } else if (name === "link") {
        isValid = !value || value.match(/^https?:\/\/.+\..+/) !== null;
      } else if (name === "author") {
        isValid = value.trim().length > 0;
      }
      
      if (isValid) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    } else if (formData.description.length > 500) {
      newErrors.description = "Description must be 500 characters or less";
    }

    const normalizedImageUrl = normalizeImageUrl(formData.imageUrl);
    if (!formData.imageUrl.trim()) {
      newErrors.imageUrl = "Image URL is required";
    } else if (
      !normalizedImageUrl.match(
        /^(https?:\/\/.+\..+|^\/.+)$/
      )
    ) {
      newErrors.imageUrl = "Please enter a valid URL or local path (starting with /)";
    }

    if (formData.link && !formData.link.match(/^https?:\/\/.+\..+/)) {
      newErrors.link = "Please enter a valid URL";
    }

    if (!formData.author.trim()) {
      newErrors.author = "Author is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isLoading) return; // Prevent duplicate submissions
    if (!validateForm()) {
      toast({
        title: "Validation error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const authorNickname = session?.user?.name || "Unknown User";

      const response = await fetch("/api/posts", {
        method: initialData ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          date: date?.toISOString(),
          _id: initialData?._id,
          authorId: session?.user?.id,
          author: authorNickname,
          published: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save post");
      }

      toast({
        title: initialData ? "Post updated" : "Post created",
        description: initialData
          ? "Your post has been updated successfully"
          : "Your post has been published successfully",
      });

      // Dispatch custom event to trigger post list refresh
      window.dispatchEvent(new Event(initialData ? "postUpdated" : "postCreated"));

      // Refresh the page to show updated data
      router.refresh();

      onOpenChange(false);
      // Reset form
      setFormData({
        title: "",
        description: "",
        imageUrl: "",
        type: "EVENT",
        link: "",
        author: session?.user?.nickname || session?.user?.name || "",
        authorId: session?.user?.id || "",
      });
      setDate(new Date());
      setErrors({});
    } catch (error) {
      // Only log errors in development
      if (process.env.NODE_ENV === "development") {
        console.error("Error saving post:", error);
      }
      toast({
        title: "Error",
        description: "Failed to save post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[calc(100vh-2rem)] sm:max-h-[85vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-2 sm:space-y-2.5 pb-3 sm:pb-4 border-b border-border/40 pr-10 sm:pr-0">
          <div className="flex items-start sm:items-center gap-2.5 sm:gap-3">
            {initialData ? (
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                <Edit className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            ) : (
              <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold leading-tight break-words">
                {initialData ? "Edit Post" : "Create New Post"}
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm mt-1 text-muted-foreground break-words">
                {initialData
                  ? "Update the post details below"
                  : "Fill in the details to create a new community post"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 md:space-y-6 py-3 sm:py-4 md:py-6">
          {/* Title */}
          <div className="space-y-2 sm:space-y-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="title" className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                Title <span className="text-destructive">*</span>
              </Label>
              <span className={cn(
                "text-xs text-muted-foreground",
                formData.title.length > 200 && "text-destructive"
              )}>
                {formData.title.length}/200
              </span>
            </div>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter post title"
              className={cn(
                "min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 focus:border-primary/50 transition-colors touch-manipulation w-full",
                errors.title && "border-destructive focus:border-destructive"
              )}
            />
            {errors.title && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.title}
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2 sm:space-y-2.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="description" className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                Description <span className="text-destructive">*</span>
              </Label>
              <span className={cn(
                "text-xs text-muted-foreground",
                formData.description.length > 500 && "text-destructive"
              )}>
                {formData.description.length}/500
              </span>
            </div>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter post description"
              rows={5}
              className={cn(
                "resize-none text-base sm:text-sm border-2 focus:border-primary/50 transition-colors min-h-[120px] sm:min-h-[100px] touch-manipulation w-full",
                errors.description && "border-destructive focus:border-destructive"
              )}
            />
            {errors.description && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.description}
              </p>
            )}
          </div>

          {/* Image URL */}
          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="imageUrl" className="flex items-center gap-2 text-sm sm:text-base font-medium">
              <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Image URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="imageUrl"
              name="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => {
                handleChange(e);
                setImageError(false);
              }}
              placeholder="https://example.com/image.jpg"
              className={cn(
                "min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 focus:border-primary/50 transition-colors touch-manipulation w-full",
                errors.imageUrl && "border-destructive focus:border-destructive"
              )}
            />
            {errors.imageUrl && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.imageUrl}
              </p>
            )}
            {debouncedImageUrl && !imageError && debouncedImageUrl.length > 0 && (
              <div className="mt-2 sm:mt-3 rounded-lg overflow-hidden border-2 border-border relative w-full aspect-video bg-muted">
                <Image
                  src={debouncedImageUrl}
                  alt={`Preview of image for ${formData.title || "post"}`}
                  fill
                  className="object-cover"
                  unoptimized
                  onError={() => {
                    setImageError(true);
                  }}
                  onLoadingComplete={() => {
                    setImageError(false);
                  }}
                />
              </div>
            )}
            {imageError && (
              <div className="mt-2 sm:mt-3 rounded-lg border-2 border-destructive/50 bg-destructive/5 p-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                <p className="text-xs text-destructive">
                  Failed to load image. Please check the URL.
                </p>
              </div>
            )}
          </div>

          {/* Type and Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div className="space-y-2 sm:space-y-2.5">
              <Label htmlFor="type" className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <Type className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                Type <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleSelectChange("type", value)}
              >
                <SelectTrigger className="min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 touch-manipulation w-full">
                  <SelectValue placeholder="Select post type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EVENT">Event</SelectItem>
                  <SelectItem value="ARTICLE">Article</SelectItem>
                  <SelectItem value="NEWS">News</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 sm:space-y-2.5">
              <Label htmlFor="date" className="flex items-center gap-2 text-sm sm:text-base font-medium">
                <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 touch-manipulation",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                    <span className="truncate">
                      {date ? format(date, "PPP") : "Pick a date"}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 sm:min-w-[350px]" align="start">
                  <CalendarWithDropdowns
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Link */}
          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="link" className="flex items-center gap-2 text-sm sm:text-base font-medium">
              <LinkIcon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Link (Optional)
            </Label>
            <div className="relative">
              <Input
                id="link"
                name="link"
                value={formData.link}
                onChange={handleChange}
                placeholder="https://example.com/article"
                className={cn(
                  "min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 focus:border-primary/50 transition-colors touch-manipulation w-full pr-10",
                  errors.link && "border-destructive focus:border-destructive"
                )}
              />
              {formData.link && (
                <a
                  href={formData.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  title="Open link in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            {errors.link && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.link}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              External link where users can read more about this post
            </p>
          </div>

          {/* Author */}
          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="author" className="flex items-center gap-2 text-sm sm:text-base font-medium">
              <User className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              Author <span className="text-destructive">*</span>
            </Label>
            <Input
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="Author name"
              className={cn(
                "min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 focus:border-primary/50 transition-colors touch-manipulation w-full",
                errors.author && "border-destructive focus:border-destructive"
              )}
            />
            {errors.author && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                {errors.author}
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2 pt-4 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px] text-base sm:text-sm touch-manipulation order-2 sm:order-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-[40px] text-base sm:text-sm touch-manipulation order-1 sm:order-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                <span>{initialData ? "Updating..." : "Creating..."}</span>
              </>
            ) : (
              <>
                {initialData ? (
                  <>
                    <Edit className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span>Update Post</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span>Create Post</span>
                  </>
                )}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
