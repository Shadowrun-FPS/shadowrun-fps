"use client";

import { useEffect, useRef, useState } from "react";

type VisibleMountProps = {
  children: React.ReactNode;
  /**
   * Rendered until the element is near the viewport.
   * Keep it lightweight to avoid main-thread work.
   */
  fallback?: React.ReactNode;
  /** IntersectionObserver rootMargin. */
  rootMargin?: string;
};

export function VisibleMount({
  children,
  fallback = null,
  rootMargin = "400px 0px",
}: VisibleMountProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin, threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, visible]);

  return <div ref={ref}>{visible ? children : fallback}</div>;
}

