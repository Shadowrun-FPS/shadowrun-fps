/**
 * Builds the 1200×630 social cards in public/og.
 *
 * One shared city plate, then each page's stone wordmark and a short line.
 * Matches is generated with the set and stays unwired until that page is public.
 *
 * Subtitles are set in Cinzel Medium (SIL OFL, see scripts/fonts/OFL.txt).
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fontkit from "fontkit";
import sharp, { type OverlayOptions } from "sharp";
import { OG_CARDS, OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH, type OgCardKey } from "../lib/og-images";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const WIDTH = OG_IMAGE_WIDTH;
const HEIGHT = OG_IMAGE_HEIGHT;
const FONT_PATH = path.join(ROOT, "scripts/fonts/Cinzel-Medium.ttf");
const OUT_DIR = path.join(ROOT, "public/og");

/** Tighter than the 16:9 hero, centered on the rift, tower, and skyline. */
const PLATE_CROP = { left: 224, top: 156, width: 1600, height: 840 } as const;

const PAGE_MARK_WIDTH = 1000;
const HOME_MARK_WIDTH = 1000;
const BRAND_MARK_WIDTH = 320;
const GROUP_CENTER_Y = 308;
const SUBTITLE_GAP = 18;
const BRAND_TOP = 36;

const STONE_WORDMARK = "public/shadowrun-wordmark-stone.png";

type CardSpec = {
  wordmark: string;
  subtitle: string;
  markWidth: number;
  showBrand: boolean;
};

const CARDS: Record<OgCardKey, CardSpec> = {
  home: {
    wordmark: STONE_WORDMARK,
    subtitle: "Download and play free",
    markWidth: HOME_MARK_WIDTH,
    showBrand: false,
  },
  download: {
    wordmark: "public/page_logos/download.webp",
    subtitle: "Launcher for Windows",
    markWidth: PAGE_MARK_WIDTH,
    showBrand: true,
  },
  events: {
    wordmark: "public/page_logos/events.webp",
    subtitle: "Announcements and community nights",
    markWidth: PAGE_MARK_WIDTH,
    showBrand: true,
  },
  troubleshooting: {
    wordmark: "public/page_logos/troubleshooting.webp",
    subtitle: "GFWL, NAT, and crash fixes",
    markWidth: PAGE_MARK_WIDTH,
    showBrand: true,
  },
  privacy: {
    wordmark: "public/page_logos/privacy.webp",
    subtitle: "How we handle your data",
    markWidth: PAGE_MARK_WIDTH,
    showBrand: true,
  },
  terms: {
    wordmark: "public/page_logos/terms.webp",
    subtitle: "Website and launcher terms",
    markWidth: PAGE_MARK_WIDTH,
    showBrand: true,
  },
  matches: {
    wordmark: "public/page_logos/matches.webp",
    subtitle: "Ranked series and scoreboards",
    markWidth: PAGE_MARK_WIDTH,
    showBrand: true,
  },
};

const font = fontkit.openSync(FONT_PATH);

function scrimSvg(): Buffer {
  return Buffer.from(`<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#020617" stop-opacity="0.5"/>
      <stop offset="34%" stop-color="#020617" stop-opacity="0.58"/>
      <stop offset="68%" stop-color="#020617" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0.42"/>
    </linearGradient>
    <radialGradient id="r" cx="50%" cy="46%" r="46%">
      <stop offset="0%" stop-color="#01030a" stop-opacity="0.62"/>
      <stop offset="58%" stop-color="#01030a" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="#01030a" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#v)"/>
  <rect width="${WIDTH}" height="${HEIGHT}" fill="url(#r)"/>
</svg>`);
}

async function prepareMark(relativePath: string, width: number): Promise<Buffer> {
  return sharp(path.join(ROOT, relativePath))
    .trim({ threshold: 12 })
    .resize({ width, withoutEnlargement: false })
    .ensureAlpha()
    .modulate({ brightness: 1.55, saturation: 0.72 })
    .linear([1.08, 1.08, 1.08, 1], [10, 8, 6, 0])
    .png()
    .toBuffer();
}

async function markShadow(mark: Buffer): Promise<Buffer> {
  return sharp(mark)
    .linear([0, 0, 0, 0.8], [0, 0, 0, 0])
    .blur(14)
    .png()
    .toBuffer();
}

type RasterText = { png: Buffer; width: number; height: number };

function subtitleSvg(text: string, fontSize: number): {
  svg: Buffer;
  width: number;
  height: number;
} {
  const run = font.layout(text);
  const scale = fontSize / font.unitsPerEm;
  const tracking = fontSize * 0.12;
  let cursor = 0;
  const paths: string[] = [];

  run.glyphs.forEach((glyph, index) => {
    const position = run.positions[index];
    if (!position) return;
    const advance = (position.xAdvance || glyph.advanceWidth) * scale;
    const commands = glyph.path
      .scale(scale, -scale)
      .translate(cursor + position.xOffset * scale, position.yOffset * scale)
      .toSVG();
    if (commands) paths.push(`<path d="${commands}"/>`);
    const extra = glyph.name === "space" ? tracking * 0.35 : tracking;
    cursor += advance + extra;
  });

  if (run.glyphs.length > 0) {
    const last = run.glyphs[run.glyphs.length - 1];
    cursor -= last?.name === "space" ? tracking * 0.35 : tracking;
  }

  const ascent = font.ascent * scale;
  const descent = Math.abs(font.descent) * scale;
  const padX = 4;
  const padY = 4;
  const width = Math.ceil(cursor + padX * 2);
  const height = Math.ceil(ascent + descent + padY * 2);
  const baseline = padY + ascent;
  const svg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <g fill="#efeae2" transform="translate(${padX} ${baseline})">
    ${paths.join("")}
  </g>
</svg>`);
  return { svg, width, height };
}

async function rasterSubtitle(text: string): Promise<RasterText> {
  let fontSize = 28;
  let drawn = subtitleSvg(text, fontSize);
  while (drawn.width > 900 && fontSize > 18) {
    fontSize -= 1;
    drawn = subtitleSvg(text, fontSize);
  }
  const png = await sharp(drawn.svg).png().toBuffer();
  return { png, width: drawn.width, height: drawn.height };
}

async function textShadow(text: Buffer): Promise<Buffer> {
  return sharp(text).linear([0, 0, 0, 0.9], [0, 0, 0, 0]).blur(3).png().toBuffer();
}

async function buildPlate(): Promise<Buffer> {
  const city = await sharp(path.join(ROOT, "public/hero-bg.webp"))
    .extract(PLATE_CROP)
    .resize(WIDTH, HEIGHT, { fit: "fill" })
    .modulate({ brightness: 1.16, saturation: 1.2 })
    .png()
    .toBuffer();

  return sharp(city)
    .composite([{ input: scrimSvg(), blend: "over" }])
    .png()
    .toBuffer();
}

function centeredLeft(itemWidth: number): number {
  return Math.round((WIDTH - itemWidth) / 2);
}

async function buildCard(plate: Buffer, spec: CardSpec, key: OgCardKey): Promise<Buffer> {
  const mark = await prepareMark(spec.wordmark, spec.markWidth);
  const markMeta = await sharp(mark).metadata();
  const markWidth = markMeta.width ?? spec.markWidth;
  const markHeight = markMeta.height ?? 0;
  const shadow = await markShadow(mark);
  const subtitle = await rasterSubtitle(spec.subtitle);
  const subtitleShade = await textShadow(subtitle.png);

  const groupHeight = markHeight + SUBTITLE_GAP + subtitle.height;
  let markTop = Math.round(GROUP_CENTER_Y - groupHeight / 2);

  const layers: OverlayOptions[] = [];

  if (spec.showBrand) {
    const brand = await prepareMark(STONE_WORDMARK, BRAND_MARK_WIDTH);
    const brandMeta = await sharp(brand).metadata();
    const brandWidth = brandMeta.width ?? BRAND_MARK_WIDTH;
    const brandHeight = brandMeta.height ?? 0;
    const brandShadow = await markShadow(brand);
    const brandLeft = centeredLeft(brandWidth);
    layers.push(
      { input: brandShadow, left: brandLeft, top: BRAND_TOP + 5 },
      { input: brand, left: brandLeft, top: BRAND_TOP }
    );

    const minTop = BRAND_TOP + brandHeight + 28;
    if (markTop < minTop) markTop = minTop;
  }

  const markLeft = centeredLeft(markWidth);
  const subtitleTop = markTop + markHeight + SUBTITLE_GAP;
  const subtitleLeft = centeredLeft(subtitle.width);

  if (subtitleTop + subtitle.height > HEIGHT - 36) {
    throw new Error(`${key} subtitle overflows the card`);
  }

  layers.push(
    { input: shadow, left: markLeft, top: markTop + 8 },
    { input: mark, left: markLeft, top: markTop },
    { input: subtitleShade, left: subtitleLeft, top: subtitleTop + 2 },
    { input: subtitle.png, left: subtitleLeft, top: subtitleTop }
  );

  return sharp(plate)
    .composite(layers)
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toBuffer();
}

/** Full-height square centered so the wordmark stays whole and the lit tower stays in frame. */
const PLAYER_ART_CROP = { left: 448, top: 0, width: 1152, height: 1152 } as const;
const PLAYER_ART_SIZE = 512;

async function buildPlayerArtwork(): Promise<void> {
  const output = path.join(ROOT, "public/player-artwork.jpg");
  await sharp(path.join(ROOT, "public/hero-logo-bg.webp"))
    .extract(PLAYER_ART_CROP)
    .resize(PLAYER_ART_SIZE, PLAYER_ART_SIZE)
    .jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: "4:4:4" })
    .toFile(output);
  const info = await stat(output);
  console.log(`player-artwork.jpg  ${Math.round(info.size / 1024)} KB`);
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });
  await buildPlayerArtwork();
  const plate = await buildPlate();
  const keys = Object.keys(CARDS) as OgCardKey[];

  for (const key of keys) {
    const spec = CARDS[key];
    const fileName = OG_CARDS[key].file;
    const output = path.join(OUT_DIR, fileName);
    const jpeg = await buildCard(plate, spec, key);
    await sharp(jpeg).toFile(output);
    const info = await stat(output);
    console.log(`${fileName}  ${Math.round(info.size / 1024)} KB`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
