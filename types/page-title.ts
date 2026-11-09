export type PageTitleLogoKey =
  "download" | "events" | "troubleshooting" | "privacy" | "matches" | "terms";

export interface PageTitleLogo {
  src: string;
  width: number;
  height: number;
  /** Text equivalent of the artwork; this is the heading's accessible name. */
  alt: string;
}
