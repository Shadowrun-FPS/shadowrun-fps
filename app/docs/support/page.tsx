<<<<<<< HEAD
=======
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "Support",
};

import Link from "next/link";
import Image from "next/image";
>>>>>>> 84f10e6a6b47511cff8daa10493bdb559ae350bb
import React from "react";

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
