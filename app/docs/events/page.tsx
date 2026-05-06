import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import FeaturedPosts from "./featured-posts";
import EventsClient from "./events-client";

export const metadata: Metadata = {
  title: "Events",
  description:
    "Stay updated with the latest Shadowrun FPS community events, tournaments, and news.",
  alternates: {
    canonical: "/docs/events",
  },
  openGraph: {
    title: "Events | Shadowrun FPS",
    description:
      "Stay updated with the latest Shadowrun FPS community events, tournaments, and news.",
    url: "https://www.shadowrunfps.com/docs/events",
    type: "website",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Events",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Events | Shadowrun FPS",
    description:
      "Stay updated with the latest Shadowrun FPS community events, tournaments, and news.",
    images: ["/hero.png"],
  },
};

export default function EventsPage() {
  return (
    <DocLayout>
      <EventsClient />
    </DocLayout>
  );
}
