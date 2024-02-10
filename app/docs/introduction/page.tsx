export const dynamic = "force-dynamic";

import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Introduction",
  openGraph: {
    title: "Introduction",
  },
};

import Link from "next/link";
import Image from "next/image";
import React from "react";
import FeaturedPosts from "@/app/docs/introduction/featured-posts";
import StaffRoster from "@/app/docs/introduction/staff-roster";

export default function IntroductionPage() {
  return (
    <div className="flex flex-col items-center justify-center ">
      <div className="mx-auto mt-12 md:px-6">
        <section className="mb-8 text-center">
          <h2 className="mb-12 text-3xl font-bold">
            Meet the{" "}
            <u className="text-primary dark:text-primary-400">
              Community Support Team
            </u>
          </h2>
          <div>
            <StaffRoster />
          </div>
          <p>
            Just a group of people passionate about the Shadowrun FPS
            volunteering their time to help provide a space for the future of
            the game and community.
          </p>
        </section>
      </div>
      <div className="max-w-[1400px]">
        <FeaturedPosts />
      </div>
      <div className="text-center">
        <h2 className="mb-4">Stay Connected</h2>
        <p className="mb-4">
          Follow us on social media for updates and announcements about our
          progress:
        </p>
        <ul>
          <li>
            <a
              href="https://twitter.com/i/communities/1688188047064470011"
              target="_blank"
              rel="noopener noreferrer"
            >
              Twitter
            </a>
          </li>
          {/* <li>
            <a
              href="https://www.facebook.com/example"
              target="_blank"
              rel="noopener noreferrer"
            >
              Facebook
            </a>
          </li> */}
          {/* <li>
            <a
              href="https://www.instagram.com/example"
              target="_blank"
              rel="noopener noreferrer"
            >
              Instagram
            </a>
          </li> */}
        </ul>
      </div>
    </div>
  );
}
