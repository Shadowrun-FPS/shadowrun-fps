import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support",
  openGraph: {
    title: "Support",
    description: "Shadowrun FPS Support page.",
  },
};

export default function SupportPage() {
  return (
    <div className="mx-auto mt-8 prose lg:prose-xl dark:prose-invert">
      <h1>Support Page is Under Construction</h1>
      <p>
        Were currently working hard to enhance your experience. Our website is
        undergoing some renovations to bring you exciting new content and
        features.
      </p>
      <p>
        We appreciate your patience and cant wait to share the improvements with
        you. Please check back soon!
      </p>
      <h2>Contact Us</h2>
      <p>
        If you have urgent inquiries or need assistance, feel free to reach out
        to us through the community discord.
      </p>
      <h2>Stay Connected</h2>
      <p>
        Follow us on social media for updates and announcements about our
        progress:
      </p>
    </div>
  );
}
