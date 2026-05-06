"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  FileText,
  RefreshCw,
  AlertCircle,
  Search,
  ExternalLink,
  GripVertical,
  X,
} from "lucide-react";
import { PostDialog } from "./post-dialog";
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
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PostManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Show Edit/Delete row (e.g. admin). Row 1 always shows reorder + optional Visit link. */
  canManagePosts?: boolean;
}

export function PostManager({
  open,
  onOpenChange,
  canManagePosts = true,
}: PostManagerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editPost, setEditPost] = useState<any>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const [reorderingPostId, setReorderingPostId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/posts");
      if (!response.ok) {
        throw new Error("Failed to fetch posts");
      }
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching posts:", error);
      }
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async () => {
    if (!deletePostId) return;
    // Note: isDeleting state would be needed for duplicate prevention, but this is handled by deletePostId state

    try {
      const response = await fetch(`/api/posts/${deletePostId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete post");
      }

      toast({
        title: "Post deleted",
        description: "The post has been deleted successfully",
      });

      router.refresh();
      setPosts(posts.filter((post) => post._id !== deletePostId));
      setDeletePostId(null);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error deleting post:", error);
      }
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleBulkReorder = async (newOrderedPosts: any[]) => {
    if (reorderingPostId) return; // Prevent duplicate submissions
    setReorderingPostId("bulk"); // Use a special value for bulk operations

    try {
      // Prepare the bulk reorder payload
      const reorderedPayload = newOrderedPosts.map((post, index) => ({
        _id: post._id,
        order: index,
      }));

      const response = await fetch(`/api/posts/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          posts: reorderedPayload,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder posts");
      }

      // Update order values in the new array to match the new positions
      const updatedPosts = newOrderedPosts.map((post, index) => ({
        ...post,
        order: index,
      }));

      // Optimistically update the UI immediately with correct order values
      // This ensures the UI updates instantly before the server response
      setPosts(updatedPosts);

      // Refresh from server to ensure consistency
      // This will update with the actual server state after the reorder completes
      try {
        await fetchPosts();
      } catch (error) {
        // If refresh fails, the optimistic update is still in place
        // The user will see the reordered list even if the refresh fails
        if (process.env.NODE_ENV === "development") {
          console.error("Error refreshing posts after reorder:", error);
        }
      }

      toast({
        title: "✓ Posts reordered",
        description: "The post order has been saved successfully",
      });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error reordering posts:", error);
      }
      toast({
        title: "Error",
        description: "Failed to reorder posts",
        variant: "destructive",
      });
      // Revert on error
      await fetchPosts();
    } finally {
      setReorderingPostId(null); // Clear the reordering state
    }
  };

  const handleReorder = async (postId: string, direction: "up" | "down") => {
    if (reorderingPostId) return; // Prevent duplicate submissions
    
    // Sort all posts by order field (not by date) for reordering operations
    const orderSortedPosts = [...posts].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
    });
    
    const currentIndex = orderSortedPosts.findIndex((post) => post._id === postId);
    if (currentIndex === -1) return;
    
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === orderSortedPosts.length - 1)
    ) {
      return; // Can't move further in this direction
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    
    // Create new ordered array based on order field
    const newPosts = [...orderSortedPosts];
    const [movedPost] = newPosts.splice(currentIndex, 1);
    newPosts.splice(newIndex, 0, movedPost);

    // Use bulk reorder
    await handleBulkReorder(newPosts);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    // Sort posts by order field first (not by date) for reordering operations
    const orderSortedPosts = [...posts].sort((a, b) => {
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
    });

    // Get the actual post index from filtered posts, but find in order-sorted array
    const draggedPost = filteredPosts[draggedIndex];
    const actualDraggedIndex = orderSortedPosts.findIndex((p) => p._id === draggedPost._id);
    const dropPost = filteredPosts[dropIndex];
    const actualDropIndex = orderSortedPosts.findIndex((p) => p._id === dropPost._id);

    if (actualDraggedIndex === -1 || actualDropIndex === -1) {
      setDraggedIndex(null);
      return;
    }

    // Create new ordered array based on order field
    const newPosts = [...orderSortedPosts];
    const [movedPost] = newPosts.splice(actualDraggedIndex, 1);
    newPosts.splice(actualDropIndex, 0, movedPost);

    setDraggedIndex(null);

    // Use bulk reorder
    await handleBulkReorder(newPosts);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const formatDate = (dateValue: string | Date | undefined) => {
    if (!dateValue) return "No date";

    try {
      let date: Date;
      
      if (dateValue instanceof Date) {
        // Already a Date object
        date = dateValue;
      } else if (typeof dateValue === "string") {
        // Handle different string formats
        // Check if it's in MM-DD-YYYY format (e.g., "10-17-2023")
        const mmddyyyyMatch = dateValue.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
        if (mmddyyyyMatch) {
          const [, month, day, year] = mmddyyyyMatch;
          date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Try standard Date parsing (ISO, etc.)
          date = new Date(dateValue);
        }
      } else {
        date = new Date(dateValue);
      }

      // Check if date is valid before formatting
      if (isNaN(date.getTime())) {
        return "Invalid date";
      }

      return format(date, "MMM d, yyyy");
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Filter and sort posts by order (not by date) for the manage modal
  const filteredPosts = posts
    .filter((post) => {
    const matchesSearch =
      !searchQuery ||
      post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || post.type === filterType;
    
    return matchesSearch && matchesType;
    })
    .sort((a, b) => {
      // Sort by order field first (for manual ordering)
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      return orderA - orderB;
  });

  // Get unique post types for filter (stable order)
  const postTypes = Array.from(new Set(posts.map((post) => post.type).filter(Boolean))).sort(
    (a, b) => String(a).localeCompare(String(b))
  );

  const globalOrderSorted = useMemo(
    () =>
      [...posts].sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        return orderA - orderB;
      }),
    [posts]
  );

  // Refresh posts after edit dialog closes
  useEffect(() => {
    if (!editPost && open) {
      const timer = setTimeout(() => {
        fetchPosts();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [editPost, open]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-[min(100vw-1rem,900px)] rounded-2xl border-border/60 shadow-xl sm:max-w-[900px] max-h-[min(100dvh-1rem,calc(100vh-2rem))] sm:max-h-[85vh] overflow-y-auto overflow-x-hidden p-3 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] sm:p-4 md:p-6">
          <DialogHeader className="space-y-2 sm:space-y-2.5 pb-3 sm:pb-4 border-b border-border/40 pr-12 sm:pr-16 md:pr-20 text-left">
            <div className="flex flex-col gap-3 justify-between items-stretch sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-base font-bold leading-tight break-words sm:text-lg md:text-xl lg:text-2xl">
                  Manage Posts
                </DialogTitle>
                <DialogDescription className="mt-1 text-xs break-words sm:text-sm text-muted-foreground">
                  Drag to reorder • Tap arrows to move • Edit or delete posts
                </DialogDescription>
              </div>
              <Button
                variant="outline"
                onClick={fetchPosts}
                disabled={isLoading}
                className="w-full shrink-0 gap-2 rounded-xl px-4 h-11 sm:h-9 sm:w-auto sm:px-5 touch-manipulation"
                title="Refresh posts"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span className="text-sm">Refresh</span>
              </Button>
            </div>
          </DialogHeader>

          {/* Search + post type filter (dropdown below search) */}
          {!isLoading && posts.length > 0 && (
            <div className="flex flex-col gap-3 pt-3 sm:pt-4 border-b border-border/40 pb-3 sm:pb-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Search posts by title, description, or author..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    "rounded-xl pl-9 h-11 sm:h-10",
                    searchQuery.trim() ? "pr-10" : "pr-3"
                  )}
                  aria-label="Search posts"
                />
                {searchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" aria-hidden />
                  </button>
                ) : null}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Label
                  htmlFor="post-type-filter"
                  className="text-sm font-medium text-muted-foreground shrink-0 sm:min-w-[5.5rem]"
                >
                  Post type
                </Label>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger
                    id="post-type-filter"
                    className="h-11 rounded-xl sm:h-10 w-full min-w-0 sm:w-fit sm:min-w-[10rem] sm:max-w-[13rem]"
                  >
                    <SelectValue placeholder="Filter by post type" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="z-[100]">
                    <SelectItem value="all">All ({posts.length})</SelectItem>
                    {postTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type} ({posts.filter((p) => p.type === type).length})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="mt-2.5 min-[375px]:mt-3 sm:mt-4 md:mt-6">
            {isLoading ? (
              <div className="flex flex-col justify-center items-center py-6 min-[375px]:py-8 sm:py-12 md:py-16">
                <Loader2 className="h-7 w-7 min-[375px]:h-8 min-[375px]:w-8 sm:h-10 sm:w-10 animate-spin text-muted-foreground mb-3 min-[375px]:mb-4" />
                <p className="text-xs min-[375px]:text-sm sm:text-base text-muted-foreground">
                  Loading posts...
                </p>
              </div>
            ) : (
              <div className="space-y-2 min-[375px]:space-y-2.5 sm:space-y-3 md:space-y-4">
                {filteredPosts.length === 0 && posts.length > 0 ? (
                  <Card className="rounded-2xl border border-dashed border-border/60 bg-muted/5">
                    <CardContent className="flex flex-col justify-center items-center py-6 min-[375px]:py-8 sm:py-12 md:py-16 text-center px-2.5 min-[375px]:px-3 sm:px-4">
                      <div className="p-2.5 min-[375px]:p-3 sm:p-4 rounded-full bg-muted/50 mb-3 min-[375px]:mb-4">
                        <Search className="w-7 h-7 min-[375px]:w-8 min-[375px]:h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm min-[375px]:text-base sm:text-lg font-semibold mb-1.5 min-[375px]:mb-2">
                        No posts found
                      </h3>
                      <p className="text-xs min-[375px]:text-sm sm:text-base text-muted-foreground max-w-sm break-words">
                        Try adjusting your search or filter criteria.
                      </p>
                    </CardContent>
                  </Card>
                ) : posts.length === 0 ? (
                  <Card className="rounded-2xl border border-dashed border-border/60 bg-muted/5">
                    <CardContent className="flex flex-col justify-center items-center py-6 min-[375px]:py-8 sm:py-12 md:py-16 text-center px-2.5 min-[375px]:px-3 sm:px-4">
                      <div className="p-2.5 min-[375px]:p-3 sm:p-4 rounded-full bg-muted/50 mb-3 min-[375px]:mb-4">
                        <FileText className="w-7 h-7 min-[375px]:w-8 min-[375px]:h-8 sm:w-10 sm:h-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm min-[375px]:text-base sm:text-lg font-semibold mb-1.5 min-[375px]:mb-2">
                        No posts found
                      </h3>
                      <p className="text-xs min-[375px]:text-sm sm:text-base text-muted-foreground max-w-sm break-words">
                        Create your first post to get started sharing events and
                        news with the community.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-2 min-[375px]:space-y-2.5 sm:space-y-3 md:space-y-4">
                    {filteredPosts.map((post, index) => {
                      // filteredPosts is already sorted by order, so index matches order position
                      // Use the post's order field as the source of truth for display
                      const displayOrder = post.order ?? index;
                      const externalUrl =
                        post.link || post.linkAddress || "";
                      const globalIndex = globalOrderSorted.findIndex(
                        (p) => p._id === post._id
                      );
                      const isDragging = draggedIndex === index;
                      const isDragOver = dragOverIndex === index;
                      return (
                      <Card
                        key={post._id}
                        draggable
                        onDragStart={() => handleDragStart(index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "rounded-2xl border border-border/70 shadow-sm transition-all duration-200 touch-manipulation w-full max-w-full overflow-hidden",
                          !isDragging &&
                            "hover:border-primary/35 hover:shadow-md",
                          isDragging &&
                            "opacity-50 scale-[0.98] shadow-lg border-primary/80 rotate-[0.5deg]",
                          isDragOver &&
                            "border-primary/70 shadow-md scale-[1.01] bg-primary/5"
                        )}
                      >
                        <CardContent className="p-2.5 min-[375px]:p-3 sm:p-4 md:p-5 lg:p-6 w-full max-w-full overflow-hidden">
                          <div className="flex flex-col gap-2.5 min-[375px]:gap-3 sm:gap-4 md:gap-5 w-full max-w-full">
                            {/* Post Info */}
                            <div className="flex-1 min-w-0 space-y-1.5 min-[375px]:space-y-2 sm:space-y-2.5 w-full max-w-full overflow-hidden">
                              {/* Mobile: two rows (title block, then badges). sm+: title left / meta right */}
                              <div className="flex w-full max-w-full flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                                <div className="flex w-full min-w-0 items-start gap-0 sm:gap-2 group/drag sm:flex-1">
                                  <div
                                    className="mt-0.5 hidden flex-shrink-0 self-start p-1 -ml-1 rounded-full hover:bg-muted/50 transition-colors sm:block"
                                    title="Drag to reorder"
                                  >
                                    <GripVertical className="w-4 h-4 text-muted-foreground/50 group-hover/drag:text-muted-foreground cursor-grab active:cursor-grabbing transition-colors" />
                                  </div>
                                  <h3 className="min-w-0 flex-1 font-semibold text-xs min-[375px]:text-sm sm:text-base md:text-lg lg:text-xl break-words leading-snug">
                                    {post.title}
                                  </h3>
                                </div>
                                <div className="flex w-full shrink-0 items-center justify-start gap-2 sm:w-auto sm:gap-3 sm:pt-0.5">
                                  <div className="flex min-w-0 flex-wrap items-center gap-1.5 sm:gap-2">
                                    <span className="text-[10px] min-[375px]:text-xs sm:text-sm text-muted-foreground font-medium px-1.5 min-[375px]:px-2 py-0.5 rounded bg-muted/50 tabular-nums">
                                      #{displayOrder + 1}
                                    </span>
                                    <Badge
                                      variant={
                                        post.type === "EVENT"
                                          ? "default"
                                          : post.type === "NEWS"
                                          ? "secondary"
                                          : "outline"
                                      }
                                      className="whitespace-nowrap text-[10px] min-[375px]:text-xs sm:text-sm"
                                    >
                                      {post.type}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              <p className="text-xs min-[375px]:text-sm md:text-base text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed break-words">
                                {post.description}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 min-[375px]:gap-1.5 sm:gap-2 text-[10px] min-[375px]:text-xs sm:text-sm text-muted-foreground">
                                <span className="truncate max-w-[45%] min-[375px]:max-w-none">
                                  By {post.author || "Unknown"}
                                </span>
                                <span className="hidden min-[375px]:inline">
                                  •
                                </span>
                                <span className="truncate max-w-[45%] min-[375px]:max-w-none">
                                  {formatDate(
                                    post.datePublished ||
                                    post.date ||
                                      post.createdAt ||
                                      post.publishedAt
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Row 1: reorder + optional link (full width). Row 2: Edit/Delete when canManagePosts. */}
                            <div className="flex w-full max-w-full flex-col gap-3 border-t border-border/40 pt-3">
                              <div
                                className="grid w-full min-h-[44px] grid-cols-4 gap-2 sm:gap-3 items-stretch"
                                role="group"
                                aria-label={
                                  externalUrl
                                    ? "Reorder post or open external link"
                                    : "Reorder post"
                                }
                              >
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    handleReorder(post._id, "up")
                                  }
                                  disabled={
                                    globalIndex <= 0 ||
                                    globalIndex === -1 ||
                                    reorderingPostId !== null
                                  }
                                  className="col-span-1 flex h-10 min-h-[44px] w-full min-w-0 shrink-0 items-center justify-center rounded-xl px-0 touch-manipulation sm:h-9 sm:min-h-0 sm:rounded-md"
                                  title={
                                    globalIndex <= 0
                                      ? "Already at top"
                                      : "Move up"
                                  }
                                >
                                  {reorderingPostId !== null ? (
                                    <Loader2 className="w-4 h-4 sm:h-5 sm:w-5 animate-spin" />
                                  ) : (
                                    <ArrowUp className="w-4 h-4 sm:h-5 sm:w-5" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={() =>
                                    handleReorder(post._id, "down")
                                  }
                                  disabled={
                                    globalIndex >=
                                      globalOrderSorted.length - 1 ||
                                    globalIndex === -1 ||
                                    reorderingPostId !== null
                                  }
                                  className="col-span-1 flex h-10 min-h-[44px] w-full min-w-0 shrink-0 items-center justify-center rounded-xl px-0 touch-manipulation sm:h-9 sm:min-h-0 sm:rounded-md"
                                  title={
                                    globalIndex >=
                                    globalOrderSorted.length - 1
                                      ? "Already at bottom"
                                      : "Move down"
                                  }
                                >
                                  {reorderingPostId !== null ? (
                                    <Loader2 className="w-4 h-4 sm:h-5 sm:w-5 animate-spin" />
                                  ) : (
                                    <ArrowDown className="w-4 h-4 sm:h-5 sm:w-5" />
                                  )}
                                </Button>
                                {externalUrl ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="col-span-2 h-10 min-h-0 w-full min-w-0 gap-1.5 rounded-xl px-2 touch-manipulation sm:h-9 sm:rounded-md sm:px-3"
                                  >
                                    <a
                                      href={externalUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open linked page in a new tab"
                                      aria-label={`Visit link for ${post.title}`}
                                      className="flex h-full min-h-0 w-full min-w-0 items-center justify-center gap-1.5 no-underline"
                                    >
                                      <ExternalLink
                                        className="h-4 w-4 shrink-0"
                                        aria-hidden
                                      />
                                      <span className="inline min-[360px]:hidden">
                                        Link
                                      </span>
                                      <span className="hidden min-[360px]:inline">
                                        Visit link
                                      </span>
                                    </a>
                                  </Button>
                                ) : (
                                  <div
                                    className="col-span-2 min-h-[44px] min-w-0 sm:min-h-9"
                                    aria-hidden
                                  />
                                )}
                              </div>

                              {canManagePosts ? (
                                <div className="flex w-full gap-2 border-t border-border/40 pt-3">
                                  <Button
                                    variant="ghost"
                                    onClick={() => setEditPost(post)}
                                    className="h-11 min-h-[44px] flex-1 gap-2 rounded-xl px-3 touch-manipulation sm:h-10 sm:rounded-md"
                                    title="Edit post"
                                  >
                                    <Edit className="shrink-0 w-4 h-4 sm:h-5 sm:w-5" />
                                    <span className="text-sm">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    onClick={() =>
                                      setDeletePostId(post._id)
                                    }
                                    className="h-11 min-h-[44px] flex-1 gap-2 rounded-xl px-3 text-destructive hover:text-destructive/90 hover:bg-destructive/10 touch-manipulation sm:h-10 sm:rounded-md"
                                    title="Delete post"
                                  >
                                    <Trash2 className="shrink-0 w-4 h-4 sm:h-5 sm:w-5" />
                                    <span className="text-sm">Delete</span>
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Post Dialog */}
      {editPost && (
        <PostDialog
          open={!!editPost}
          onOpenChange={(open) => {
            if (!open) setEditPost(null);
          }}
          initialData={editPost}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletePostId}
        onOpenChange={(open) => !open && setDeletePostId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex gap-3 items-center mb-2">
              <div className="p-2 rounded-full bg-destructive/10">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <AlertDialogTitle>Delete Post?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              This action cannot be undone. This will permanently delete the
              post and remove it from the community.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto min-h-[44px] sm:min-h-0">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90 min-h-[44px] sm:min-h-0"
            >
              Delete Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
