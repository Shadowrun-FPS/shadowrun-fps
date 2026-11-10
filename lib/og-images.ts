export const SITE_ORIGIN = "https://www.shadowrunfps.com";

export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const OG_CARDS = {
  home: {
    file: "home.jpg",
    alt: "Shadowrun skyline with the stone wordmark. Download and play free.",
  },
  download: {
    file: "download.jpg",
    alt: "Download Shadowrun FPS",
  },
  events: {
    file: "events.jpg",
    alt: "Shadowrun FPS community events",
  },
  troubleshooting: {
    file: "troubleshooting.jpg",
    alt: "Troubleshooting Shadowrun FPS",
  },
  privacy: {
    file: "privacy.jpg",
    alt: "Shadowrun FPS privacy policy",
  },
  terms: {
    file: "terms.jpg",
    alt: "Shadowrun FPS terms of use",
  },
  matches: {
    file: "matches.jpg",
    alt: "Shadowrun FPS matches",
  },
} as const;

export type OgCardKey = keyof typeof OG_CARDS;

export type OgImage = {
  url: string;
  width: number;
  height: number;
  alt: string;
};

export function ogImages(key: OgCardKey): OgImage[] {
  const card = OG_CARDS[key];
  return [
    {
      url: `${SITE_ORIGIN}/og/${card.file}`,
      width: OG_IMAGE_WIDTH,
      height: OG_IMAGE_HEIGHT,
      alt: card.alt,
    },
  ];
}
