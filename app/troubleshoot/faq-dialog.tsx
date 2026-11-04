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
import { Loader2, Trash2 } from "lucide-react";

interface FAQ {
  _id?: string;
  title: string;
  content: string;
  list: string[];
  href: string;
  link: string;
  category: string;
}

interface FAQDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: FAQ | null;
  onSuccess?: () => void;
}

export function FAQDialog({
  open,
  onOpenChange,
  initialData,
  onSuccess,
}: FAQDialogProps) {
  const [formData, setFormData] = useState<FAQ>({
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

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        list: listItems.filter((item) => item.trim() !== ""),
      };

      const url = initialData
        ? `/api/faqs/${initialData._id}`
        : "/api/faqs";
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
      console.error("Error saving FAQ:", error);
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
      <DialogContent className="sm:max-w-[600px] max-h-[calc(100vh-2rem)] sm:max-h-[85vh] overflow-y-auto p-3 sm:p-4 md:p-6">
        <DialogHeader className="space-y-2 sm:space-y-2.5 pb-3 sm:pb-4 border-b border-border/40 pr-10 sm:pr-0">
          <DialogTitle className="text-base sm:text-lg md:text-xl font-bold leading-tight break-words">
            {initialData ? "Edit FAQ" : "Create New FAQ"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm mt-1 text-muted-foreground break-words">
            {initialData
              ? "Update the FAQ details below"
              : "Fill in the details to create a new FAQ"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-5 md:space-y-6 py-3 sm:py-4 md:py-6">
          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="title" className="text-sm sm:text-base font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter FAQ title"
              className="min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 focus:border-primary/50 transition-colors touch-manipulation w-full"
            />
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="content" className="text-sm sm:text-base font-medium">
              Content
            </Label>
            <Textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="Enter FAQ content"
              rows={4}
              className="resize-none text-base sm:text-sm border-2 focus:border-primary/50 transition-colors min-h-[100px] touch-manipulation w-full"
            />
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label className="text-sm sm:text-base font-medium">
              List Items
            </Label>
            <div className="space-y-2">
              {listItems.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={item}
                    onChange={(e) => handleListChange(index, e.target.value)}
                    placeholder={`List item ${index + 1}`}
                    className="min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 focus:border-primary/50 transition-colors touch-manipulation flex-1"
                  />
                  {listItems.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeListItem(index)}
                      className="h-10 w-10 sm:h-9 sm:w-9 touch-manipulation text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      title="Remove list item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addListItem}
                className="w-full sm:w-auto h-10 sm:h-9 touch-manipulation"
              >
                Add List Item
              </Button>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="href" className="text-sm sm:text-base font-medium">
              Link URL
            </Label>
            <Input
              id="href"
              name="href"
              value={formData.href}
              onChange={handleChange}
              placeholder="https://example.com"
              className="min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 focus:border-primary/50 transition-colors touch-manipulation w-full"
            />
          </div>

          <div className="space-y-2 sm:space-y-2.5">
            <Label htmlFor="link" className="text-sm sm:text-base font-medium">
              Link Text
            </Label>
            <Input
              id="link"
              name="link"
              value={formData.link}
              onChange={handleChange}
              placeholder="Download fix"
              className="min-h-[44px] sm:min-h-[40px] text-base sm:text-sm border-2 focus:border-primary/50 transition-colors touch-manipulation w-full"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
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

