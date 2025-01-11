export const dynamic = "force-dynamic";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Events",
  openGraph: {
    title: "Events",
  },
};

import React from "react";
import FeaturedPosts from "@/app/docs/events/featured-posts";

export default function EventsPage() {
  return (
    <div className="flex flex-col items-center justify-center ">
      <div className="mx-auto mt-12 md:px-6"></div>
      <div className="max-w-[1400px]">
        <FeaturedPosts />
      </div>
    </div>
  );
}
