import Link from "next/link";
import Image from "next/image";
import React from "react";
import { DocHero } from "@/components/doc-hero";

export default function SupportPage() {
  return (
    <>
      <DocHero title={""} />
      <div className="flex flex-col items-center justify-center mx-8">
        <div className="prose text-center lg:prose-xl dark:prose-invert">
          <br />
          <h1>Support Page is Under Construction</h1>
          <p>
            Were currently working hard to enhance your experience. Our website
            is undergoing some renovations to bring you exciting new content and
            features.
          </p>
          <p>
            We appreciate your patience and cant wait to share the improvements
            with you. Please check back soon!
          </p>
        </div>

        <div className="mt-8 text-center">
          <h2>Contact Us</h2>
          <p>
            If you have urgent inquiries or need assistance, feel free to reach
            out to us through the community discord.
          </p>
        </div>

        <div className="mt-8 text-center">
          <h2>Stay Connected</h2>
          <p>
            Follow us on social media for updates and announcements about our
            progress:
          </p>
        </div>
      </div>
    </>
  );
}
