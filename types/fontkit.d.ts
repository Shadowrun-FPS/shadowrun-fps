declare module "fontkit" {
  interface GlyphPath {
    scale(sx: number, sy: number): GlyphPath;
    translate(tx: number, ty: number): GlyphPath;
    toSVG(): string;
  }

  interface Glyph {
    name: string;
    advanceWidth: number;
    path: GlyphPath;
  }

  interface GlyphPosition {
    xAdvance: number;
    xOffset: number;
    yOffset: number;
  }

  interface LayoutRun {
    glyphs: Glyph[];
    positions: GlyphPosition[];
  }

  interface Font {
    unitsPerEm: number;
    ascent: number;
    descent: number;
    layout(text: string): LayoutRun;
  }

  interface FontkitStatic {
    openSync(filename: string): Font;
  }

  const fontkit: FontkitStatic;
  export default fontkit;
}
