import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import { ogImages } from "@/lib/og-images";
import FeaturedPosts from "./featured-posts";
import EventsClient from "./events-client";

export const metadata: Metadata = {
  title: "Community Events and Tournaments",
  description:
    "Tournaments, community nights, and schedules for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
  alternates: {
    canonical: "/events",
  },
  openGraph: {
    title: "Shadowrun FPS Community Events and Tournaments",
    description:
      "Tournaments, community nights, and schedules for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
    url: "https://www.shadowrunfps.com/events",
    siteName: "Shadowrun FPS",
    locale: "en_US",
    type: "website",
    images: ogImages("events"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS Community Events and Tournaments",
    description:
      "Tournaments, community nights, and schedules for Shadowrun FPS, the 2007 FASA Studios multiplayer shooter.",
    images: ogImages("events"),
  },
};

export default function EventsPage() {
  return (
    <DocLayout>
      <EventsClient />
    </DocLayout>
  );
}
