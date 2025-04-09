import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import FeaturedPosts from "./featured-posts";
import EventsClient from "./events-client";

export const metadata: Metadata = {
  title: "Events - Shadowrun FPS",
  description:
    "Stay updated with the latest Shadowrun FPS community events, tournaments, and news.",
};

export default function EventsPage() {
  return (
    <DocLayout>
      <EventsClient />
    </DocLayout>
  );
}
