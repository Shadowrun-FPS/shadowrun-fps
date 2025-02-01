export const dynamic = "force-dynamic";

import Head from "next/head";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Shadowrun FPS Events - Community News & Updates",
  description:
    "Stay up to date with the latest events, community updates, and news about Shadowrun FPS. Join the discussions and connect with fellow players!",
  openGraph: {
    title: "Shadowrun FPS Events - Community News & Updates",
    description:
      "Stay up to date with the latest events, community updates, and news about Shadowrun FPS. Join the discussions and connect with fellow players!",
    url: "https://ShadowrunFPS.com/docs/events",
    images: [
      {
        url: "https://ShadowrunFPS.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Event Banner",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Shadowrun FPS Events - Community News & Updates",
    description:
      "Stay up to date with the latest events, community updates, and news about Shadowrun FPS. Join the discussions and connect with fellow players!",
    images: [
      {
        url: "https://ShadowrunFPS.com/shadowrun_invite_banner.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS Event Banner",
      },
    ],
  },
};

import React from "react";
import FeaturedPosts from "@/app/docs/events/featured-posts";

export default function EventsPage() {
  return (
    <>
      <Head>
        <meta
          name="description"
          content="Stay up to date with the latest events, community updates, and news about Shadowrun FPS. Join the discussions and connect with fellow players!"
        />
        <meta
          property="og:title"
          content="Shadowrun FPS Events - Community News & Updates"
        />
        <meta
          property="og:description"
          content="Stay up to date with the latest events, community updates, and news about Shadowrun FPS. Join the discussions and connect with fellow players!"
        />
        <meta
          property="og:image"
          content="https://ShadowrunFPS.com/shadowrun_invite_banner.png"
        />
        <meta
          property="og:url"
          content="https://ShadowrunFPS.com/docs/events"
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Shadowrun FPS Events - Community News & Updates"
        />
        <meta
          name="twitter:description"
          content="Stay up to date with the latest events, community updates, and news about Shadowrun FPS. Join the discussions and connect with fellow players!"
        />
        <meta
          name="twitter:image"
          content="https://ShadowrunFPS.com/images/events-banner.jpg"
        />
      </Head>

      <div className="flex flex-col items-center justify-center">
        <div className="mx-auto mt-12 md:px-6"></div>
        <div className="max-w-[1400px]">
          <h1 className="mb-8 text-4xl font-extrabold text-center text-white">
            Shadowrun FPS Community Events
          </h1>
          <p className="mb-12 text-center text-white">
            Stay up to date with the latest events, community news, and fun
            activities for Shadowrun FPS players. Join us and be part of the
            community!
          </p>

          {/* Featured Posts Component */}
          <FeaturedPosts />
        </div>
      </div>
    </>
  );
}
