import type { PageTitleLogo, PageTitleLogoKey } from "@/types";

/** Stone wordmark artwork for each page title (trimmed WebP, 1400px wide). */
export const PAGE_TITLE_LOGOS: Record<PageTitleLogoKey, PageTitleLogo> = {
  download: {
    src: "/page_logos/download.webp",
    width: 1400,
    height: 248,
    alt: "Download",
  },
  events: {
    src: "/page_logos/events.webp",
    width: 1400,
    height: 302,
    alt: "Events",
  },
  troubleshooting: {
    src: "/page_logos/troubleshooting.webp",
    width: 1400,
    height: 181,
    alt: "Troubleshooting",
  },
  privacy: {
    src: "/page_logos/privacy.webp",
    width: 1400,
    height: 244,
    alt: "Privacy Policy",
  },
  matches: {
    src: "/page_logos/matches.webp",
    width: 1400,
    height: 260,
    alt: "Matches",
  },
  terms: {
    src: "/page_logos/terms.webp",
    width: 1400,
    height: 215,
    alt: "Terms of Use",
  },
};
