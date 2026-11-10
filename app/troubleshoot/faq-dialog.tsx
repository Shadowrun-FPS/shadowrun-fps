"use client";

import { useState, useEffect } from "react";
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
import { useToast } from "@/components/ui/use-toast";
import { safeLog } from "@/lib/security";
import { Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FAQFormValues } from "@/types";

interface FAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: FAQFormValues | null;
  onSuccess?: () => void;
}

export function FAQDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: FAQDialogProps) {
  const [formData, setFormData] = useState<FAQFormValues>({
    title: "",
    content: "",
    list: [],
    href: "",
    link: "",
    category: "errors",
  });
  const [listItems, setListItems] = useState<string[]>([""]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        content: initialData.content || "",
        list: initialData.list || [],
        href: initialData.href || "",
        link: initialData.link || "",
        category: initialData.category || "errors",
      });
      setListItems(
        initialData.list && initialData.list.length > 0
          ? initialData.list
          : [""]
      );
    } else {
      setFormData({
        title: "",
        content: "",
        list: [],
        href: "",
        link: "",
        category: "errors",
      });
      setListItems([""]);
    }
  }, [initialData, open]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleListChange = (index: number, value: string) => {
    const newList = [...listItems];
    newList[index] = value;
    setListItems(newList);
  };

  const addListItem = () => {
    setListItems([...listItems, ""]);
  };

  const removeListItem = (index: number) => {
    if (listItems.length > 1) {
      setListItems(listItems.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Missing fields",
        description: "Title is required",
        variant: "destructive",
      });
      return;
    }

    const href = formData.href.trim();
    const link = formData.link.trim();
    if ((href && !link) || (!href && link)) {
      toast({
        title: "Incomplete link",
        description: "Link URL and Link Text must both be filled, or both left empty.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        href,
        link,
        list: listItems.filter((item) => item.trim() !== ""),
      };

      const url = initialData ? `/api/faqs/${initialData._id}` : "/api/faqs";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save FAQ");
      }

      toast({
        title: initialData ? "FAQ updated" : "FAQ created",
        description: initialData
          ? "Your FAQ has been updated successfully"
          : "Your FAQ has been created successfully",
      });

      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      safeLog.error("Error saving FAQ:", error);
      toast({
        title: "Error",
        description: "Failed to save FAQ. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[min(100dvh-1rem,calc(100vh-2rem))] w-[calc(100vw-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[85vh] sm:max-w-[600px] sm:rounded-lg"
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border/40 px-4 pb-3 pt-4 text-left sm:space-y-2.5 sm:px-6 sm:pb-4 sm:pt-6 pr-12 sm:pr-14">
          <DialogTitle className="break-words text-base font-bold leading-tight sm:text-lg md:text-xl">
            {initialData ? "Edit FAQ" : "Create New FAQ"}
          </DialogTitle>
          <DialogDescription className="mt-1 break-words text-xs text-muted-foreground sm:text-sm">
            {initialData
              ? "Update the FAQ details below"
              : "Fill in the details to create a new FAQ"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:space-y-5 sm:px-6 sm:py-5 md:space-y-6">
          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="title" className="text-sm font-medium sm:text-base">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter FAQ title"
              className="min-h-[44px] w-full border-2 text-base touch-manipulation transition-colors focus:border-primary/50 sm:min-h-[40px] sm:text-sm"
            />
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label
              htmlFor="content"
              className="text-sm font-medium sm:text-base"
            >
              Content
            </Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Enter FAQ content"
              rows={4}
              className="min-h-[100px] w-full resize-none border-2 text-base touch-manipulation transition-colors focus:border-primary/50 sm:text-sm"
            />
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label className="text-sm font-medium sm:text-base">
              List Items
            </Label>
            <div className="space-y-2">
              {listItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleListChange(index, e.target.value)}
                    placeholder={`List item ${index + 1}`}
                    className="min-h-[44px] flex-1 border-2 text-base touch-manipulation transition-colors focus:border-primary/50 sm:min-h-[40px] sm:text-sm"
                  />
                  {listItems.length > 1 ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem(index)}
                      className="h-11 w-11 shrink-0 touch-manipulation text-muted-foreground hover:bg-destructive/10 hover:text-destructive sm:h-10 sm:w-10"
                      title="Remove list item"
                      aria-label={`Remove list item ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addListItem}
                className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
              >
                Add List Item
              </Button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="href" className="text-sm font-medium sm:text-base">
              Link URL
            </Label>
            <Input
              id="href"
              name="href"
              value={formData.href}
              onChange={handleChange}
              placeholder="https://example.com"
              className="min-h-[44px] w-full border-2 text-base touch-manipulation transition-colors focus:border-primary/50 sm:min-h-[40px] sm:text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Link URL and Link Text are shown together on the page. Fill both,
              or leave both empty.
            </p>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="link" className="text-sm font-medium sm:text-base">
              Link Text
            </Label>
            <Input
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="Download fix"
              className="min-h-[44px] w-full border-2 text-base touch-manipulation transition-colors focus:border-primary/50 sm:min-h-[40px] sm:text-sm"
            />
          </div>
        </div>

        <DialogFooter
          className={cn(
            "shrink-0 flex-col gap-2 border-t border-border/40 bg-background px-4 py-3 sm:flex-row sm:justify-end sm:gap-2 sm:space-x-0 sm:px-6 sm:py-4",
            "pb-[max(0.75rem,env(safe-area-inset-bottom,0px))]"
          )}
        >
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="h-11 w-full touch-manipulation sm:h-10 sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : initialData ? (
              "Update FAQ"
            ) : (
              "Create FAQ"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
