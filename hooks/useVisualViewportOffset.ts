"use client";

import { useEffect, useState } from "react";

const VISUAL_VIEWPORT_OFFSET_CSS_VAR = "--visual-viewport-offset-top";

/**
 * Returns the vertical offset between the layout viewport and the visual viewport.
 * On some mobile browsers (notably Edge on iOS), when the user scrolls and the URL bar
 * hides, the layout viewport expands and fixed elements stay at top:0 of the layout
 * viewport, which can put them above the visible screen. This hook tracks the offset
 * and updates a CSS variable so fixed elements (header, sheets) stay pinned to the
 * visual viewport.
 *
 * Only runs in the browser when visualViewport is supported (all modern mobile).
 */
export function useVisualViewportOffset(): number {
  const [offsetTop, setOffsetTop] = useState(0);

  useEffect(() => {
    const viewport = typeof window !== "undefined" ? window.visualViewport : null;
    if (!viewport) return;

    const update = () => {
      const top = viewport.offsetTop;
      setOffsetTop(top);
      document.documentElement.style.setProperty(
        VISUAL_VIEWPORT_OFFSET_CSS_VAR,
        `${top}px`
      );
    };

    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);

    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      document.documentElement.style.removeProperty(VISUAL_VIEWPORT_OFFSET_CSS_VAR);
    };
  }, []);

  return offsetTop;
}
