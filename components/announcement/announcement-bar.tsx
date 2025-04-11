"use client";

import React, { useEffect, useState } from "react";
import { X, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export interface Announcement {
  id: string;
  text: string;
  linkText?: string;
  linkUrl?: string;
  createdAt: string;
  color?: string;
}

export default function AnnouncementBar() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Load announcement from localStorage
    const storedAnnouncement = localStorage.getItem("currentAnnouncement");

    if (storedAnnouncement) {
      const parsed = JSON.parse(storedAnnouncement);

      // Check if this announcement was dismissed by the user
      const dismissedId = localStorage.getItem("dismissedAnnouncementId");
      if (dismissedId !== parsed.id) {
        setAnnouncement(parsed);
        setVisible(true);
      }
    }
  }, []);

  const dismissAnnouncement = () => {
    if (announcement) {
      localStorage.setItem("dismissedAnnouncementId", announcement.id);
      setVisible(false);
    }
  };

  if (!visible || !announcement) return null;

  // Default color is orange if none specified
  const bgColor = announcement.color || "bg-orange-500";
  const hoverColor =
    announcement.color?.replace("500", "600") || "bg-orange-600";

  return (
    <div className={`w-full ${bgColor} py-1 px-2 text-white`}>
      <div className="container flex items-center justify-between max-w-screen-2xl">
        <div className="flex items-center justify-center flex-1 space-x-2 text-center">
          <Bell size={16} className="flex-shrink-0" />
          <div
            className="inline-block text-sm"
            dangerouslySetInnerHTML={{ __html: announcement.text }}
          />
          {announcement.linkUrl && announcement.linkText && (
            <Link
              href={announcement.linkUrl}
              className="flex-shrink-0 text-sm font-bold underline hover:text-white/80"
              target="_blank"
              rel="noopener noreferrer"
            >
              {announcement.linkText}
            </Link>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={`h-6 w-6 text-white hover:${hoverColor.replace(
            "bg-",
            ""
          )} flex-shrink-0`}
          onClick={dismissAnnouncement}
        >
          <X size={16} />
        </Button>
      </div>
    </div>
  );
}
