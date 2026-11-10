"use client";

import { useState, useEffect, useMemo, type DragEvent } from "react";
import { useSession } from "next-auth/react";
import { safeLog } from "@/lib/security";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  PlusCircle,
  Edit,
  Trash2,
  GripVertical,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
  Search,
  X,
  Check,
  Loader2,
} from "lucide-react";
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
import type { FAQ } from "@/types";

const FAQS_CACHE_KEY = "/api/faqs?category=errors";

interface UserPermissions {
  canManageContent?: boolean;
}

type ReorderSaveState = "idle" | "saving" | "saved";

interface FAQsSectionProps {
  initialFaqs?: FAQ[];
}

export function FAQsSection({ initialFaqs = [] }: FAQsSectionProps) {
  const { data: session } = useSession();
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
  const [loading, setLoading] = useState(initialFaqs.length === 0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [deleteFaqId, setDeleteFaqId] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] =
    useState<UserPermissions | null>(null);
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [openItem, setOpenItem] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [reorderSaveState, setReorderSaveState] =
    useState<ReorderSaveState>("idle");
  const { toast } = useToast();

  useEffect(() => {
    if (!session?.user) {
      setUserPermissions(null);
      return;
    }

    const fetchPermissions = async () => {
      try {
        const { deduplicatedFetch } = await import(
          "@/lib/request-deduplication"
        );
        const userData = await deduplicatedFetch<{
          permissions: {
            canManageContent: boolean;
          };
        }>("/api/user/data", {
          ttl: 60000,
        });
        setUserPermissions(userData.permissions);
      } catch (error) {
        safeLog.error("Error fetching permissions:", error);
        setUserPermissions(null);
      }
    };

    void fetchPermissions();
  }, [session]);

  const canManageContent = userPermissions?.canManageContent ?? false;

  useEffect(() => {
    // Prefer SSR data so FAQ answers are in the initial HTML for search/AI crawlers.
    if (initialFaqs.length > 0) {
      setLoading(false);
      return;
    }

    const fetchFAQs = async () => {
      try {
        const { deduplicatedFetch } = await import(
          "@/lib/request-deduplication"
        );
        const data = await deduplicatedFetch<FAQ[]>(FAQS_CACHE_KEY, {
          ttl: 300000,
        });
        setFaqs(data);
      } catch (error) {
        safeLog.error("Error fetching FAQs:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchFAQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only; SSR payload seeds state
  }, []);

  useEffect(() => {
    if (reorderSaveState !== "saved") return;
    const timer = window.setTimeout(() => {
      setReorderSaveState("idle");
    }, 1500);
    return () => window.clearTimeout(timer);
  }, [reorderSaveState]);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || isReorderMode) return faqs;

    return faqs.filter((faq) => {
      const haystack = [
        faq.title,
        faq.content,
        ...(faq.list ?? []),
        faq.link,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [faqs, searchQuery, isReorderMode]);

  const refreshFaqs = async () => {
    const { deduplicatedFetch, requestDeduplicator } = await import(
      "@/lib/request-deduplication"
    );
    requestDeduplicator.invalidate(FAQS_CACHE_KEY);
    const data = await deduplicatedFetch<FAQ[]>(FAQS_CACHE_KEY, {
      ttl: 300000,
      useCache: false,
    });
    setFaqs(data);
  };

  const persistOrder = async (updatedFaqs: FAQ[]) => {
    setReorderSaveState("saving");
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

      setReorderSaveState("saved");
    } catch (error) {
      safeLog.error("Error updating FAQ order:", error);
      setReorderSaveState("idle");
      toast({
        title: "Error",
        description: "Failed to update FAQ order. Please try again.",
        variant: "destructive",
      });
      try {
        await refreshFaqs();
      } catch (revertError) {
        safeLog.error("Error reverting FAQs:", revertError);
      }
    }
  };

  const moveFaq = async (fromIndex: number, toIndex: number) => {
    if (
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= faqs.length ||
      toIndex >= faqs.length ||
      reorderSaveState === "saving"
    ) {
      return;
    }

    const newFaqs = [...faqs];
    const [movedFaq] = newFaqs.splice(fromIndex, 1);
    newFaqs.splice(toIndex, 0, movedFaq);

    const updatedFaqs = newFaqs.map((faq, index) => ({
      ...faq,
      order: index,
    }));

    setFaqs(updatedFaqs);
    await persistOrder(updatedFaqs);
  };

  const handleDelete = async () => {
    if (!deleteFaqId) return;

    try {
      const response = await fetch(`/api/faqs/${deleteFaqId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setFaqs(faqs.filter((faq) => faq._id !== deleteFaqId));
        const { requestDeduplicator } = await import(
          "@/lib/request-deduplication"
        );
        requestDeduplicator.invalidate(FAQS_CACHE_KEY);
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
    try {
      await refreshFaqs();
    } catch (error) {
      safeLog.error("Error refreshing FAQs:", error);
    }
  };

  const toggleReorderMode = () => {
    setIsReorderMode((prev) => {
      const next = !prev;
      if (next) {
        setOpenItem("");
        setSearchQuery("");
      }
      setDraggedIndex(null);
      setDragOverIndex(null);
      setReorderSaveState("idle");
      return next;
    });
  };

  const handleDragStart = (e: DragEvent, index: number) => {
    if (!isReorderMode) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
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

    const fromIndex = draggedIndex;
    setDraggedIndex(null);
    await moveFaq(fromIndex, dropIndex);
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
        {canManageContent ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <Button
                variant={isReorderMode ? "default" : "outline"}
                onClick={toggleReorderMode}
                aria-pressed={isReorderMode}
                disabled={reorderSaveState === "saving"}
                className={cn(
                  "h-11 gap-2 px-3 touch-manipulation transition-colors md:h-10 sm:w-auto sm:px-4",
                  "w-full sm:w-auto",
                  isReorderMode
                    ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-2 hover:border-primary/50 hover:bg-accent hover:text-foreground"
                )}
              >
                {isReorderMode ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <ArrowUpDown className="h-4 w-4" />
                )}
                <span className="font-semibold">
                  {isReorderMode ? (
                    "Done"
                  ) : (
                    <>
                      <span className="sm:hidden">Reorder</span>
                      <span className="hidden sm:inline">Reorder FAQs</span>
                    </>
                  )}
                </span>
              </Button>
              <Button
                onClick={handleAdd}
                disabled={isReorderMode}
                className="h-11 w-full gap-2 px-3 touch-manipulation sm:w-auto sm:px-4 md:h-10"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="sm:hidden">Add</span>
                <span className="hidden sm:inline">Add FAQ</span>
              </Button>
            </div>
            {isReorderMode ? (
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-muted-foreground sm:text-sm">
                  Use the arrows to move items. On a pointer device, drag the
                  handle to reorder.
                </p>
                <p
                  className="text-xs text-muted-foreground tabular-nums sm:text-sm"
                  aria-live="polite"
                >
                  {reorderSaveState === "saving" ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving…
                    </span>
                  ) : reorderSaveState === "saved" ? (
                    <span className="inline-flex items-center gap-1.5 text-foreground/80">
                      <Check className="h-3.5 w-3.5" />
                      Saved
                    </span>
                  ) : null}
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {!isReorderMode ? (
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search errors or fixes…"
              aria-label="Search FAQs"
              className={cn(
                "h-11 rounded-xl border-2 pl-9 text-base touch-manipulation sm:h-10 sm:text-sm",
                searchQuery.trim() ? "pr-10" : "pr-3"
              )}
            />
            {searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}

        {filteredFaqs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-muted/5 px-4 py-8 text-center">
            <p className="text-sm font-medium text-foreground sm:text-base">
              No matching fixes
            </p>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Try a different error code or keyword.
            </p>
          </div>
        ) : (
          <Accordion
            type="single"
            collapsible={!isReorderMode}
            value={isReorderMode ? "" : openItem}
            onValueChange={(value) => {
              if (!isReorderMode) {
                setOpenItem(value);
              }
            }}
            disabled={isReorderMode}
            className="w-full space-y-3 sm:space-y-4"
          >
            {filteredFaqs.map((faq, index) => {
              const sourceIndex = faqs.findIndex((item) => item._id === faq._id);
              const displayIndex = isReorderMode ? sourceIndex : index;

              return (
                <div
                  key={faq._id}
                  onDragOver={(e) => {
                    if (isReorderMode) {
                      handleDragOver(e, displayIndex);
                    }
                  }}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    if (isReorderMode) {
                      void handleDrop(e, displayIndex);
                    }
                  }}
                  className={cn(
                    "group w-full min-w-0 rounded-xl border-2 shadow-sm backdrop-blur-sm",
                    "transition-colors duration-200",
                    "border-border/60 bg-card/50 hover:border-border/80 hover:bg-card/80",
                    "hover:shadow-md hover:shadow-primary/5",
                    draggedIndex === displayIndex &&
                      "border-primary/40 opacity-40 shadow-lg shadow-primary/20",
                    dragOverIndex === displayIndex &&
                      "border-primary bg-primary/5 ring-2 ring-primary/20"
                  )}
                >
                  <AccordionItem
                    value={`item-${faq._id}`}
                    className={cn(
                      "mb-0 w-full min-w-0 overflow-hidden rounded-xl border-0 bg-transparent",
                      "data-[state=open]:bg-transparent data-[state=open]:shadow-none",
                      "hover:bg-transparent"
                    )}
                    disabled={isReorderMode}
                  >
                    <div className="flex w-full min-w-0 items-stretch gap-1 sm:gap-2">
                      {isReorderMode ? (
                        <>
                          <div
                            className="group/drag flex min-h-[44px] w-[44px] shrink-0 cursor-grab items-center justify-center self-stretch pl-2 active:cursor-grabbing sm:w-[52px] sm:pl-3"
                            draggable
                            onDragStart={(e) =>
                              handleDragStart(e, displayIndex)
                            }
                            onDragEnd={handleDragEnd}
                            title="Drag to reorder"
                            aria-label={`Drag to reorder ${faq.title}`}
                          >
                            <div className="rounded-lg bg-muted/50 p-2 transition-colors duration-200 group-hover/drag:bg-primary/10">
                              <GripVertical className="h-5 w-5 text-muted-foreground transition-colors duration-200 group-hover/drag:text-primary sm:h-6 sm:w-6" />
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-col justify-center gap-1 py-2 pr-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={
                                displayIndex <= 0 ||
                                reorderSaveState === "saving"
                              }
                              onClick={() =>
                                void moveFaq(displayIndex, displayIndex - 1)
                              }
                              className="h-9 w-9 touch-manipulation sm:h-8 sm:w-8"
                              title={
                                displayIndex <= 0
                                  ? "Already at top"
                                  : "Move up"
                              }
                              aria-label={`Move ${faq.title} up`}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              disabled={
                                displayIndex >= faqs.length - 1 ||
                                reorderSaveState === "saving"
                              }
                              onClick={() =>
                                void moveFaq(displayIndex, displayIndex + 1)
                              }
                              className="h-9 w-9 touch-manipulation sm:h-8 sm:w-8"
                              title={
                                displayIndex >= faqs.length - 1
                                  ? "Already at bottom"
                                  : "Move down"
                              }
                              aria-label={`Move ${faq.title} down`}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : null}

                      <AccordionTrigger
                        className={cn(
                          "min-h-[44px] min-w-0 flex-1 rounded-none px-3 py-3 text-base font-semibold hover:no-underline sm:px-5 sm:py-4 sm:text-lg",
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

                      {canManageContent && !isReorderMode ? (
                        <div className="flex shrink-0 items-center gap-0.5 self-center pr-2 sm:gap-1 sm:pr-3">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(faq)}
                            className="h-10 w-10 touch-manipulation hover:bg-accent/80 sm:h-9 sm:w-9"
                            aria-label="Edit FAQ"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteFaqId(faq._id)}
                            className="h-10 w-10 touch-manipulation text-destructive hover:bg-destructive/10 hover:text-destructive/90 sm:h-9 sm:w-9"
                            aria-label="Delete FAQ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                    <AccordionContent className="p-0">
                      <div className="space-y-4 px-4 pb-5 pt-1 sm:px-5 sm:pb-6 sm:pt-2">
                        {faq.content ? (
                          <p className="text-sm leading-relaxed text-foreground/90 sm:text-base">
                            {faq.content}
                          </p>
                        ) : null}
                        {faq.list && faq.list.length > 0 ? (
                          <ul className="mb-1 list-disc space-y-2.5 pl-5 sm:pl-6">
                            {faq.list.map((item, i) => (
                              <li
                                key={i}
                                className="text-sm leading-relaxed text-foreground/90 sm:text-base"
                              >
                                {item}
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {faq.href ? (
                          <a
                            href={faq.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${faq.link || "Download fix"} (opens in new window)`}
                            className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-primary/20 px-3 py-2 text-sm font-medium text-primary transition-colors duration-200 hover:border-primary/40 hover:bg-primary/10 hover:text-primary/90"
                          >
                            {faq.link || "Download fix"}
                            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="sr-only">Opens in new tab</span>
                          </a>
                        ) : null}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </div>
              );
            })}
          </Accordion>
        )}
      </div>

      {isDialogOpen ? (
        <FAQDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          initialData={editingFaq}
          onSuccess={handleDialogClose}
        />
      ) : null}

      <AlertDialog
        open={deleteFaqId !== null}
        onOpenChange={(open) => !open && setDeleteFaqId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this FAQ? This action cannot be
              undone.
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
