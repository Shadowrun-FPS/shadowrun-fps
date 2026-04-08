import type { Metadata } from "next";
import type { ReactNode } from "react";

const PAGE_TITLE = "Community Moderation Log";

/** Shown in search results and fallbacks */
const DESCRIPTION =
  "Public record of moderation actions on Shadowrun FPS - warnings, bans, and unbans in one place. Open the log to verify accountability and community standards.";

/**
 * Open Graph / social preview: CTA-forward copy for link shares
 * (transparency, invite to open and read the log).
 */
const OPENGRAPH_DESCRIPTION =
  "See every public moderation action in full view—tap through for transparency. We publish this log so you can verify how our team enforces the rules. Open it now.";

const KEYWORDS = [
  "Shadowrun FPS",
  "moderation log",
  "community standards",
  "transparency",
  "bans",
  "warnings",
  "public moderation",
  "Shadowrun community",
];

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: DESCRIPTION,
  keywords: KEYWORDS,
  alternates: {
    canonical: "/moderation-log",
  },
  openGraph: {
    title: `${PAGE_TITLE} | Shadowrun FPS`,
    description: OPENGRAPH_DESCRIPTION,
    url: "/moderation-log",
    siteName: "Shadowrun FPS",
    type: "website",
    locale: "en-US",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS — public moderation transparency",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${PAGE_TITLE} | Shadowrun FPS`,
    description: OPENGRAPH_DESCRIPTION,
    images: ["/hero.png"],
    creator: "@ShadowrunFPS",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function ModerationLogLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
