import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function IntroductionPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="prose text-center lg:prose-xl dark:prose-invert">
        <h1>Introduction Page is Under Construction</h1>
        <p>
          We're currently working hard to enhance your experience. Our website
          is undergoing some renovations to bring you exciting new content and
          features.
        </p>
        <p>
          We appreciate your patience and can't wait to share the improvements
          with you. Please check back soon!
        </p>
      </div>

      <div className="mt-8 text-center">
        <h2>Contact Us</h2>
        <p>
          If you have urgent inquiries or need assistance, feel free to reach
          out to us through the community discord.
        </p>
        <ul>
          {/* <li>
            Email:{" "}
            <a href="mailto:3M3RGx@protonmail.com">info@ShadowrunFPS.com</a>
          </li> */}
          {/* <li>
            Phone: <a href="tel:+1234567890">+1 (234) 567-890</a>
          </li> */}
        </ul>
      </div>

      <div className="mt-8 text-center">
        <h2>Stay Connected</h2>
        <p>
          Follow us on social media for updates and announcements about our
          progress:
        </p>
        <ul>
          <br />
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
