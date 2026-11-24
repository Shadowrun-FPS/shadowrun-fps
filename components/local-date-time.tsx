"use client";

import { useEffect, useState } from "react";

import { formatLocalDateTime } from "@/lib/match-date";

interface LocalDateTimeProps {
  iso: string;
  className?: string;
}

/** Renders a timestamp in the visitor's local timezone after mount. */
export function LocalDateTime({ iso, className }: LocalDateTimeProps) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(formatLocalDateTime(iso));
  }, [iso]);

  return (
    <time dateTime={iso} className={className} suppressHydrationWarning>
      {label ?? "…"}
    </time>
  );
}
