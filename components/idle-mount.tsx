"use client";

import { useEffect, useState } from "react";

type IdleMountProps = {
  children: React.ReactNode;
  /**
   * Fallback render while waiting to mount.
   * Defaults to `null` to avoid layout shifts.
   */
  fallback?: React.ReactNode;
  /** Minimum delay before mount (ms). */
  delayMs?: number;
};

export function IdleMount({ children, fallback = null, delayMs = 0 }: IdleMountProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      if (!cancelled) setMounted(true);
    };

    const schedule = () => {
      if (delayMs > 0) {
        timeoutId = setTimeout(run, delayMs);
        return;
      }
      run();
    };

    // Prefer idle time when available; fallback quickly otherwise.
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).requestIdleCallback(schedule, { timeout: 1200 });
    } else {
      timeoutId = setTimeout(schedule, Math.min(Math.max(delayMs, 0), 200));
    }

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [delayMs]);

  return mounted ? children : fallback;
}

