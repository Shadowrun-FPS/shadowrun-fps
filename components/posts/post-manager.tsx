"use client";

import { useState, useEffect, useCallback } from "react";
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
import { cn } from "@/lib/utils";

interface PostManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PostManager({ open, onOpenChange }: PostManagerProps) {
  const { toast } = useToast();
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editPost, setEditPost] = useState<any>(null);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);

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
      console.error("Error fetching posts:", error);
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

      // Remove the post from the list
      setPosts(posts.filter((post) => post._id !== deletePostId));
      setDeletePostId(null);
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (postId: string, direction: "up" | "down") => {
    const currentIndex = posts.findIndex((post) => post._id === postId);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === posts.length - 1)
    ) {
      return; // Can't move further in this direction
    }

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    try {
      const response = await fetch(`/api/posts/reorder`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postId,
          newIndex,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to reorder posts");
      }

      // Update local state to reflect the change
      const newPosts = [...posts];
      const [movedPost] = newPosts.splice(currentIndex, 1);
      newPosts.splice(newIndex, 0, movedPost);
      setPosts(newPosts);

      toast({
        title: "Posts reordered",
        description: "The post order has been updated",
      });
    } catch (error) {
      console.error("Error reordering posts:", error);
      toast({
        title: "Error",
        description: "Failed to reorder posts",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateValue: string | Date | undefined) => {
    if (!dateValue) return "No date";

    try {
      // Try to parse the date - it could be a string or already a Date object
      const date =
        typeof dateValue === "string" ? new Date(dateValue) : dateValue;

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] max-h-[calc(100vh-2rem)] sm:max-h-[85vh] overflow-y-auto p-3 sm:p-4 md:p-6">
          <DialogHeader className="space-y-2 sm:space-y-2.5 pb-3 sm:pb-4 border-b border-border/40 pr-12 sm:pr-16 md:pr-20">
            <div className="flex flex-col gap-3 justify-between items-start sm:flex-row sm:items-center sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3 flex-1 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 border border-primary/20 flex-shrink-0">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base font-bold leading-tight break-words sm:text-lg md:text-xl lg:text-2xl">
                    Manage Posts
                  </DialogTitle>
                  <DialogDescription className="mt-1 text-xs break-words sm:text-sm text-muted-foreground">
                    Edit, delete, or reorder your community posts
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={fetchPosts}
                disabled={isLoading}
                className="flex-shrink-0 gap-2 px-4 h-10 sm:px-5 sm:h-9 touch-manipulation"
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
                {posts.length === 0 ? (
                  <Card className="border-2 border-dashed">
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
                    {posts.map((post, index) => (
                      <Card
                        key={post._id}
                        className="border-2 hover:border-primary/50 transition-all duration-200 hover:shadow-md active:scale-[0.98] touch-manipulation"
                      >
                        <CardContent className="p-2.5 min-[375px]:p-3 sm:p-4 md:p-5 lg:p-6">
                          <div className="flex flex-col gap-2.5 min-[375px]:gap-3 sm:gap-4 md:gap-5">
                            {/* Post Info */}
                            <div className="flex-1 min-w-0 space-y-1.5 min-[375px]:space-y-2 sm:space-y-2.5">
                              <div className="flex flex-col min-[375px]:flex-row min-[375px]:flex-wrap items-start min-[375px]:items-center gap-1.5 min-[375px]:gap-2 sm:gap-2.5">
                                <h3 className="font-semibold text-xs min-[375px]:text-sm sm:text-base md:text-lg lg:text-xl break-words flex-1 min-w-0 w-full min-[375px]:w-auto">
                                  {post.title}
                                </h3>
                                <div className="flex items-center gap-1 min-[375px]:gap-1.5 sm:gap-2 flex-shrink-0 w-full min-[375px]:w-auto">
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
                                  <span className="text-[10px] min-[375px]:text-xs sm:text-sm text-muted-foreground font-medium px-1 min-[375px]:px-1.5 py-0.5 rounded bg-muted/50">
                                    #{index + 1}
                                  </span>
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
                                    post.date ||
                                      post.datePublished ||
                                      post.createdAt ||
                                      post.publishedAt
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-between gap-2 sm:gap-2.5 pt-2 sm:pt-3 border-t border-border/40">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleReorder(post._id, "up")}
                                  disabled={index === 0}
                                  className="w-10 h-10 sm:h-9 sm:w-9 touch-manipulation"
                                  title="Move up"
                                >
                                  <ArrowUp className="w-4 h-4 sm:h-5 sm:w-5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleReorder(post._id, "down")
                                  }
                                  disabled={index === posts.length - 1}
                                  className="w-10 h-10 sm:h-9 sm:w-9 touch-manipulation"
                                  title="Move down"
                                >
                                  <ArrowDown className="w-4 h-4 sm:h-5 sm:w-5" />
                                </Button>
                              </div>
                              <div className="flex gap-2 items-center sm:gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => setEditPost(post)}
                                  className="gap-2 px-6 h-10 sm:px-4 sm:h-9 touch-manipulation"
                                  title="Edit post"
                                >
                                  <Edit className="flex-shrink-0 w-4 h-4 sm:h-5 sm:w-5" />
                                  <span className="text-sm">Edit</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => setDeletePostId(post._id)}
                                  className="gap-2 px-6 h-10 sm:px-4 sm:h-9 text-destructive hover:text-destructive/90 hover:bg-destructive/10 touch-manipulation"
                                  title="Delete post"
                                >
                                  <Trash2 className="flex-shrink-0 w-4 h-4 sm:h-5 sm:w-5" />
                                  <span className="text-sm">Delete</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
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
