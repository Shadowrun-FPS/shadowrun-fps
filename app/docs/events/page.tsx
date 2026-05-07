import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import FeaturedPosts from "./featured-posts";
import EventsClient from "./events-client";

export const metadata: Metadata = {
  title: "Shadowrun FPS Community Events & Tournaments",
  description:
    "Shadowrun FPS (2007) tournaments, community nights, and competitive schedules from the preservation community. Find upcoming matches, fan-run events, and legacy multiplayer meetups.",
  alternates: {
    canonical: "/docs/events",
  },
  keywords: [
    "Shadowrun FPS events",
    "Shadowrun FPS tournaments",
    "Shadowrun community calendar",
    "legacy FPS multiplayer events",
    "Shadowrun competitive",
    "fan-run Shadowrun matches",
    "Shadowrun Discord events",
    "2007 Shadowrun PC community",
    "game preservation multiplayer",
    "abandoned game community",
    "Shadowrun Xbox 360 PC cross-play",
    "Shadowrun pickup games",
    "community-run ladder",
    "Shadowrun FPS schedule",
  ],
  openGraph: {
    title: "Shadowrun FPS Community Events & Tournaments",
    description:
      "Tournaments, community nights, and schedules for Shadowrun FPS — the fan-led game preservation hub for this classic competitive shooter.",
    url: "https://www.shadowrunfps.com/docs/events",
    siteName: "Shadowrun FPS",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.shadowrunfps.com/hero.webp",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Community Events",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS Community Events & Tournaments",
    description:
      "Tournaments, community nights, and schedules from the Shadowrun FPS preservation community.",
    images: ["https://www.shadowrunfps.com/hero.webp"],
  },
};

export default function EventsPage() {
  return (
    <DocLayout>
      <EventsClient />
    </DocLayout>
  );
}
