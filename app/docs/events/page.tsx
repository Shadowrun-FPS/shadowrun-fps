import { Metadata } from "next";
import { DocLayout } from "@/components/layouts/doc-layout";
import FeaturedPosts from "./featured-posts";

export const metadata: Metadata = {
  title: "Events - Shadowrun FPS",
  description:
    "Stay updated with the latest Shadowrun FPS community events, tournaments, and news.",
};

export default function EventsPage() {
  return (
    <DocLayout>
      <div className="space-y-12">
        {/* Hero Section */}
        <section className="relative py-16">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-background" />
          </div>
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold sm:text-5xl lg:text-6xl mb-6">
              Community Events
            </h1>
            <p className="text-xl text-muted-foreground">
              Stay connected with the latest Shadowrun FPS community events and
              updates
            </p>
          </div>
        </section>

        {/* Featured Posts Grid */}
        <section className="relative px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-background/80" />
          <div className="relative">
            <FeaturedPosts />
          </div>
        </section>
      </div>
    </DocLayout>
  );
}
