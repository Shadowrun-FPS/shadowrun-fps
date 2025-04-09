"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Edit, Trash2, ArrowUp, ArrowDown } from "lucide-react";
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
        <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Posts</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              {posts.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No posts found. Create your first post!
                </p>
              ) : (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <div
                      key={post._id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md gap-4"
                    >
                      <div className="flex-1 min-w-0 w-full">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-medium truncate max-w-[200px] sm:max-w-[300px]">
                            {post.title}
                          </h3>
                          <Badge
                            variant={
                              post.type === "EVENT" ? "default" : "secondary"
                            }
                            className="whitespace-nowrap"
                          >
                            {post.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 sm:line-clamp-1">
                          {post.description}
                        </p>
                        <div className="text-xs text-muted-foreground mt-1">
                          By {post.author || "Unknown"} •{" "}
                          {formatDate(
                            post.date ||
                              post.datePublished ||
                              post.createdAt ||
                              post.publishedAt
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReorder(post._id, "up")}
                          disabled={posts.indexOf(post) === 0}
                        >
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReorder(post._id, "down")}
                          disabled={posts.indexOf(post) === posts.length - 1}
                        >
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditPost(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletePostId(post._id)}
                          className="text-destructive hover:text-destructive/90"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
