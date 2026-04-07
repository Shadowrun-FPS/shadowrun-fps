"use client";

import { useState, useEffect, type DragEvent } from "react";
import { useSession } from "next-auth/react";
import { safeLog } from "@/lib/security";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, GripVertical, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FAQDialog } from "./faq-dialog";
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
import { useToast } from "@/components/ui/use-toast";

interface FAQ {
  _id: string;
  title: string;
  content: string;
  list: string[];
  href: string;
  link: string;
  category: string;
  order: number;
}

interface UserPermissions {
  isAdmin?: boolean;
  isModerator?: boolean;
  isDeveloper?: boolean;
  roles?: string[];
}

export function FAQsSection() {
  const { data: session } = useSession();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Check if user is admin
  useEffect(() => {
    const fetchPermissions = async () => {
      if (session?.user) {
        try {
          // ✅ Use unified endpoint with deduplication
          const { deduplicatedFetch } = await import("@/lib/request-deduplication");
          const userData = await deduplicatedFetch<{
            permissions: {
              isAdmin: boolean;
              isModerator: boolean;
              isDeveloper: boolean;
            };
          }>("/api/user/data", {
            ttl: 60000, // Cache for 1 minute
          });
          setUserPermissions(userData.permissions);
        } catch (error) {
          safeLog.error("Error fetching permissions:", error);
        }
      }
    };

    fetchPermissions();
  }, [session]);

  const DEVELOPER_ID = "238329746671271936";
  const isAdmin =
    userPermissions?.isAdmin ||
    session?.user?.id === DEVELOPER_ID ||
    (userPermissions?.roles && Array.isArray(userPermissions.roles) && 
     userPermissions.roles.some((role: string) => 
       role === process.env.NEXT_PUBLIC_ADMIN_ROLE_ID || 
       role === process.env.NEXT_PUBLIC_FOUNDER_ROLE_ID
     ));

  // Fetch FAQs - use deduplication
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const data = await deduplicatedFetch<FAQ[]>("/api/faqs?category=errors", {
          ttl: 300000, // Cache for 5 minutes (FAQs don't change often)
        });
        setFaqs(data);
      } catch (error) {
        safeLog.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFAQs();
  }, []);

  const handleDelete = async () => {
    if (!deleteFaqId) return;

    try {
      const response = await fetch(`/api/faqs/${deleteFaqId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFaqs(faqs.filter((faq) => faq._id !== deleteFaqId));
        toast({
          title: "FAQ deleted",
          description: "The FAQ has been deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete FAQ.",
          variant: "destructive",
        });
      }
    } catch (error) {
      safeLog.error("Error deleting FAQ:", error);
      toast({
        title: "Error",
        description: "Failed to delete FAQ.",
        variant: "destructive",
      });
    } finally {
      setDeleteFaqId(null);
    }
  };

  const handleEdit = (faq: FAQ) => {
    setEditingFaq(faq);
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingFaq(null);
    setIsDialogOpen(true);
  };

  const handleDialogClose = async () => {
    setIsDialogOpen(false);
    setEditingFaq(null);
    // ✅ Refresh FAQs using deduplication
    try {
      const { deduplicatedFetch } = await import("@/lib/request-deduplication");
      const data = await deduplicatedFetch<FAQ[]>("/api/faqs?category=errors", {
        ttl: 300000,
      });
      setFaqs(data);
    } catch (error) {
      safeLog.error("Error refreshing FAQs:", error);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newFaqs = [...faqs];
    const draggedFaq = newFaqs[draggedIndex];
    newFaqs.splice(draggedIndex, 1);
    newFaqs.splice(dropIndex, 0, draggedFaq);

    // Update order values
    const updatedFaqs = newFaqs.map((faq, index) => ({
      ...faq,
      order: index,
    }));

    setFaqs(updatedFaqs);
    setDraggedIndex(null);

    // Batch update all FAQs in the database
    try {
      const response = await fetch("/api/faqs/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faqs: updatedFaqs.map((faq) => ({
            _id: faq._id,
            order: faq.order,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update FAQ order");
      }

      toast({
        title: "FAQs reordered",
        description: "The FAQ order has been updated successfully.",
      });
    } catch (error) {
      safeLog.error("Error updating FAQ order:", error);
      toast({
        title: "Error",
        description: "Failed to update FAQ order. Please try again.",
        variant: "destructive",
      });
      // ✅ Revert on error using deduplication
      try {
        const { deduplicatedFetch } = await import("@/lib/request-deduplication");
        const data = await deduplicatedFetch<FAQ[]>("/api/faqs?category=errors", {
          ttl: 300000,
        });
        setFaqs(data);
      } catch (revertError) {
        safeLog.error("Error reverting FAQs:", revertError);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4 sm:space-y-5">
        {isAdmin ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
                <Button
                  variant={isReorderMode ? "default" : "outline"}
                  onClick={() => setIsReorderMode(!isReorderMode)}
                  className={cn(
                    "gap-2 px-3 sm:px-4 h-10 sm:h-9 touch-manipulation flex-1 lg:flex-initial transition-all duration-300 relative overflow-hidden",
                    isReorderMode 
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 border-2 border-primary ring-2 ring-primary/20 hover:bg-primary/90 hover:shadow-xl" 
                      : "hover:bg-accent hover:border-primary/50 hover:text-foreground border-2"
                  )}
                >
                  {isReorderMode && (
                    <span className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-primary/20 animate-pulse" />
                  )}
                  <ArrowUpDown className={cn(
                    "w-4 h-4 transition-all duration-300 relative z-10",
                    isReorderMode 
                      ? "animate-bounce text-primary-foreground" 
                      : "text-current"
                  )} />
                  <span className={cn(
                    "relative z-10 font-semibold transition-colors duration-300",
                    isReorderMode ? "text-primary-foreground" : "text-current"
                  )}>
                    <span className="sm:hidden">Reorder</span>
                    <span className="hidden sm:inline">Reorder FAQs</span>
                  </span>
                  {isReorderMode && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full animate-ping" />
                  )}
                </Button>
                <Button
                  onClick={handleAdd}
                  className="gap-2 px-3 sm:px-4 h-10 sm:h-9 touch-manipulation flex-1 lg:flex-initial"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span className="sm:hidden">Add</span>
                  <span className="hidden sm:inline">Add FAQ</span>
                </Button>
          </div>
        ) : null}
        <Accordion 
          type="single" 
          collapsible={!isReorderMode}
          disabled={isReorderMode}
          className="w-full space-y-3 sm:space-y-4"
        >
          {faqs.map((faq, index) => (
            <div
              key={faq._id}
              draggable={isReorderMode}
              onDragStart={(e) => {
                if (isReorderMode) {
                  handleDragStart(index);
                  e.dataTransfer.effectAllowed = "move";
                }
              }}
              onDragOver={(e) => {
                if (isReorderMode) {
                  handleDragOver(e, index);
                }
              }}
              onDragLeave={handleDragLeave}
              onDrop={(e) => {
                if (isReorderMode) {
                  handleDrop(e, index);
                }
              }}
              onDragEnd={handleDragEnd}
              className={cn(
                "group w-full min-w-0 border-2 rounded-xl mb-3 shadow-sm backdrop-blur-sm",
                "transition-all duration-300 ease-in-out",
                "bg-card/50 hover:bg-card/80",
                "border-border/60 hover:border-border/80",
                "hover:shadow-lg hover:shadow-primary/5",
                isReorderMode && "cursor-move select-none",
                draggedIndex === index && "opacity-40 scale-[0.98] shadow-lg shadow-primary/20 border-primary/40",
                dragOverIndex === index && "border-primary border-2 scale-[1.02] shadow-xl shadow-primary/30 bg-primary/5 ring-2 ring-primary/20",
                !isReorderMode && "hover:scale-[1.01]"
              )}
            >
              <AccordionItem
                value={`item-${index}`}
                className={cn(
                  "w-full min-w-0 border-0 rounded-xl overflow-hidden bg-transparent",
                  "data-[state=open]:bg-transparent data-[state=open]:shadow-none",
                  "hover:bg-transparent"
                )}
                disabled={isReorderMode}
              >
                <div className="flex w-full min-w-0 items-stretch gap-2 sm:gap-3">
                  {isReorderMode && (
                    <div 
                      className="flex min-h-[44px] w-[44px] shrink-0 touch-manipulation items-center justify-center self-stretch pl-3 sm:w-[52px] sm:pl-4 group/drag"
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <div className="relative rounded-lg bg-muted/50 p-2 transition-colors duration-200 group-hover/drag:bg-primary/10">
                        <GripVertical className="h-5 w-5 text-muted-foreground transition-colors duration-200 group-hover/drag:text-primary sm:h-6 sm:w-6 cursor-grab active:cursor-grabbing" />
                        <div className="absolute inset-0 rounded-lg bg-primary/0 transition-colors duration-200 group-hover/drag:bg-primary/5" />
                      </div>
                    </div>
                  )}
                  <AccordionTrigger 
                    className={cn(
                      "min-h-[44px] min-w-0 flex-1 rounded-none px-4 py-3 text-base font-semibold hover:no-underline sm:px-6 sm:py-4 sm:text-lg",
                      "touch-manipulation transition-colors duration-200",
                      "bg-transparent hover:bg-transparent active:bg-transparent",
                      "group-data-[state=open]:bg-transparent",
                      "group-data-[state=open]:text-primary",
                      "hover:text-foreground",
                      isReorderMode && "pointer-events-none opacity-90"
                    )}
                  >
                    {faq.title}
                  </AccordionTrigger>
                </div>
              <AccordionContent>
                <div className="px-4 pt-3 pb-5 sm:px-6 sm:pt-4 sm:pb-6 space-y-4">
                  {faq.content && (
                    <p className="leading-relaxed text-foreground/90 text-sm sm:text-base">{faq.content}</p>
                  )}
                  {faq.list && faq.list.length > 0 && (
                    <ul className="pl-6 space-y-2.5 list-disc mb-3">
                      {faq.list.map((item, i) => (
                        <li key={i} className="leading-relaxed text-foreground/90 text-sm sm:text-base">
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                  {faq.href && (
                    <a
                      href={faq.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${faq.link} (opens in new window)`}
                      className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-md text-sm font-medium text-primary hover:bg-primary/10 hover:text-primary/90 transition-colors duration-200 border border-primary/20 hover:border-primary/40"
                    >
                      {faq.link || "Download fix"}
                      <span className="sr-only">Opens in new tab</span>
                    </a>
                  )}
                  {isAdmin && (
                    <div className="flex items-center gap-2 mt-5 pt-4 border-t border-border/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(faq)}
                        className="gap-2 px-3 h-9 touch-manipulation hover:bg-accent/80"
                      >
                        <Edit className="w-4 h-4" />
                        <span className="sm:hidden">Edit</span>
                        <span className="hidden sm:inline">Edit FAQ</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteFaqId(faq._id)}
                        className="gap-2 px-3 h-9 text-destructive hover:text-destructive/90 hover:bg-destructive/10 touch-manipulation"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="sm:hidden">Delete</span>
                        <span className="hidden sm:inline">Delete FAQ</span>
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
            </div>
          ))}
        </Accordion>
      </div>

      {isDialogOpen && (
        <FAQDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          initialData={editingFaq}
          onSuccess={handleDialogClose}
        />
      )}

      <AlertDialog open={deleteFaqId !== null} onOpenChange={(open) => !open && setDeleteFaqId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

