"use client";

import React, { useState, useEffect, forwardRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Announcement } from "./announcement-bar";
import { v4 as uuidv4 } from "uuid";
import { Bell, Check } from "lucide-react";

// Maximum characters allowed in announcement text
const MAX_CHARS = 150;

// Color options for the announcement bar
const COLOR_OPTIONS = [
  { value: "bg-orange-500", label: "Orange" },
  { value: "bg-blue-500", label: "Blue" },
  { value: "bg-green-500", label: "Green" },
  { value: "bg-red-500", label: "Red" },
  { value: "bg-purple-500", label: "Purple" },
  { value: "bg-indigo-500", label: "Indigo" },
  { value: "bg-pink-500", label: "Pink" },
  { value: "bg-yellow-500", label: "Yellow" },
  { value: "bg-gray-500", label: "Gray" },
];

// Convert to forwardRef to handle the ref properly
const AnnouncementEditor = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  const { className, ...otherProps } = props; // Destructure className from props
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [color, setColor] = useState<string>("bg-orange-500"); // Default color
  const [currentAnnouncement, setCurrentAnnouncement] =
    useState<Announcement | null>(null);

  useEffect(() => {
    const storedAnnouncement = localStorage.getItem("currentAnnouncement");
    if (storedAnnouncement) {
      const parsed = JSON.parse(storedAnnouncement);
      setCurrentAnnouncement(parsed);
      setText(parsed.text || "");
      setLinkText(parsed.linkText || "");
      setLinkUrl(parsed.linkUrl || "");
      setColor(parsed.color || "bg-orange-500");
    }
  }, [open]);

  const publishAnnouncement = () => {
    // Create a new announcement
    const newAnnouncement: Announcement = {
      id: uuidv4(),
      text,
      linkText: linkText || undefined,
      linkUrl: linkUrl || undefined,
      color: color,
      createdAt: new Date().toISOString(),
    };

    // Store in localStorage
    localStorage.setItem(
      "currentAnnouncement",
      JSON.stringify(newAnnouncement)
    );

    // Remove any dismissed flag since this is a new announcement
    localStorage.removeItem("dismissedAnnouncementId");

    setCurrentAnnouncement(newAnnouncement);
    setOpen(false);

    // Force page reload to display the new announcement
    window.location.reload();
  };

  const clearAnnouncement = () => {
    localStorage.removeItem("currentAnnouncement");
    localStorage.removeItem("dismissedAnnouncementId");
    setCurrentAnnouncement(null);
    setText("");
    setLinkText("");
    setLinkUrl("");
    setColor("bg-orange-500");
    setOpen(false);

    // Force page reload
    window.location.reload();
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARS) {
      setText(newText);
    }
  };

  // Add this handler to prevent the dropdown from closing
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          ref={ref}
          className={`flex items-center w-full gap-2 cursor-pointer ${
            className || ""
          }`} // Merge the passed className
          {...otherProps}
          onClick={handleClick}
        >
          <Bell className="w-4 h-4" />
          <span>Manage Announcement</span>
        </button>
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px]"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader>
          <DialogTitle>Manage Site Announcement</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <div className="flex justify-between">
              <Label htmlFor="announcement-text">Announcement Text</Label>
              <span
                className={`text-xs ${
                  text.length >= MAX_CHARS ? "text-red-500" : "text-gray-500"
                }`}
              >
                {text.length}/{MAX_CHARS}
              </span>
            </div>
            <Textarea
              id="announcement-text"
              rows={3}
              placeholder="Enter announcement text. Basic HTML is supported."
              value={text}
              onChange={handleTextChange}
              maxLength={MAX_CHARS}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="link-text">Link Text (Optional)</Label>
            <Input
              id="link-text"
              placeholder="e.g. Learn More, Vote Now, etc."
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="link-url">Link URL (Optional)</Label>
            <Input
              id="link-url"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>Background Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`relative w-8 h-8 rounded-full ${
                    option.value
                  } cursor-pointer flex items-center justify-center ${
                    color === option.value ? "ring-2 ring-offset-2" : ""
                  }`}
                  title={option.label}
                  onClick={() => setColor(option.value)}
                >
                  {color === option.value && (
                    <Check className="w-4 h-4 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 border rounded">
            <p className="mb-2 text-sm font-medium">Preview:</p>
            <div className={`${color} p-2 rounded text-white text-center`}>
              <div className="inline-flex items-center gap-2">
                <Bell size={14} />
                <span className="text-sm">
                  {text || "Announcement text will appear here"}
                </span>
                {linkText && (
                  <span className="text-sm font-bold underline">
                    {linkText}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex justify-between">
          {currentAnnouncement && (
            <Button variant="destructive" onClick={clearAnnouncement}>
              Remove Announcement
            </Button>
          )}
          <Button onClick={publishAnnouncement} disabled={!text.trim()}>
            Publish Announcement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

AnnouncementEditor.displayName = "AnnouncementEditor";

export default AnnouncementEditor;
