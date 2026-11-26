export type PageTitleLogoKey =
  | "download"
  | "events"
  | "troubleshooting"
  | "privacy"
  | "matches"
  | "terms"
  | "leaderboard"
  | "rivals"
  | "comparePlayers";

export interface PageTitleLogo {
  src: string;
  width: number;
  height: number;
  /** Text equivalent of the artwork; this is the heading's accessible name. */
  alt: string;
  /** Long wordmarks need a wider hero slot so the letters stay readable. */
  wide?: boolean;
}
