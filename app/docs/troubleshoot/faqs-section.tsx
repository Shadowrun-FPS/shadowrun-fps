"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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

export function FAQsSection() {
  const { data: session } = useSession();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const { toast } = useToast();

  // Check if user is admin
  useEffect(() => {
    const fetchPermissions = async () => {
      if (session?.user) {
        try {
          const response = await fetch("/api/user/permissions");
          if (response.ok) {
            const permissions = await response.json();
            setUserPermissions(permissions);
          }
        } catch (error) {
          console.error("Error fetching permissions:", error);
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

  // Fetch FAQs
  useEffect(() => {
    const fetchFAQs = async () => {
      try {
        const response = await fetch("/api/faqs?category=errors");
        if (response.ok) {
          const data = await response.json();
          setFaqs(data);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
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
      console.error("Error deleting FAQ:", error);
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

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingFaq(null);
    // Refresh FAQs
    fetch("/api/faqs?category=errors")
      .then((res) => res.json())
      .then((data) => setFaqs(data))
      .catch(console.error);
  };

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
      console.error("Error updating FAQ order:", error);
      toast({
        title: "Error",
        description: "Failed to update FAQ order. Please try again.",
        variant: "destructive",
      });
      // Revert on error
      fetch("/api/faqs?category=errors")
        .then((res) => res.json())
        .then((data) => setFaqs(data))
        .catch(console.error);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  if (loading) {
    return (
      <div className="space-y-3 sm:space-y-4">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <section id="errors" className="space-y-3 sm:space-y-4">
        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4">
            <div className="flex-1">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Common Errors
              </h2>
              <p className="text-base sm:text-lg leading-relaxed text-muted-foreground mt-1">
                Find solutions to common issues and error messages below. Click on
                an error to see its solution.
              </p>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2 flex-shrink-0 w-full lg:w-auto lg:ml-4">
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
            )}
          </div>
        </div>
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
                "group border-2 rounded-xl mb-3 shadow-sm backdrop-blur-sm",
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
                  "border-0 rounded-xl overflow-hidden",
                  "data-[state=open]:shadow-lg data-[state=open]:border-primary/30 data-[state=open]:bg-gradient-to-br data-[state=open]:from-accent/10 data-[state=open]:to-accent/5",
                  "data-[state=open]:ring-1 data-[state=open]:ring-primary/10"
                )}
                disabled={isReorderMode}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  {isReorderMode && (
                    <div 
                      className="flex-shrink-0 pl-3 sm:pl-4 touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center group/drag"
                      onTouchStart={(e) => e.stopPropagation()}
                    >
                      <div className="relative p-2 rounded-lg bg-muted/50 group-hover/drag:bg-primary/10 transition-colors duration-200">
                        <GripVertical className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground group-hover/drag:text-primary cursor-grab active:cursor-grabbing transition-colors duration-200" />
                        <div className="absolute inset-0 rounded-lg bg-primary/0 group-hover/drag:bg-primary/5 transition-colors duration-200" />
                      </div>
                    </div>
                  )}
                  <AccordionTrigger 
                    className={cn(
                      "flex-1 px-4 py-3 sm:py-4 text-base sm:text-lg text-left sm:px-6 hover:no-underline touch-manipulation min-h-[44px] sm:min-h-0",
                      "font-semibold transition-colors duration-200",
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
      </section>

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

