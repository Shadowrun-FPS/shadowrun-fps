import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import { ogImages } from "@/lib/og-images";
import { getPosts } from "@/lib/posts";
import { safeLog } from "@/lib/security";
import type { Post } from "@/types";
import EventsClient from "./events-client";

// Posts refresh immediately on publish through revalidatePath("/events").
// This interval is the fallback for edits made outside the site.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Community Events and Announcements",
  description:
    "Announcements, community nights, and schedules for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    title: "Shadowrun FPS Community Events and Announcements",
    description:
      "Announcements, community nights, and schedules for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
    url: "https://www.shadowrunfps.com/events",
    siteName: "Shadowrun FPS",
    locale: "en_US",
    type: "website",
    images: ogImages("events"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS Community Events and Announcements",
    description:
      "Announcements, community nights, and schedules for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
    images: ogImages("events"),
  },
};

async function loadPosts(): Promise<Post[] | null> {
  try {
    return await getPosts();
  } catch (error) {
    safeLog.error("Failed to load posts for /events:", error);
    return null;
  }
}

export default async function EventsPage() {
  const posts = await loadPosts();

  return (
    <DocLayout>
      <EventsClient initialPosts={posts} />
    </DocLayout>
  );
}
