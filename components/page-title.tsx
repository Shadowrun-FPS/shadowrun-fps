import Image from "next/image";

import { PAGE_TITLE_LOGOS } from "@/lib/page-title-logos";
import { cn } from "@/lib/utils";
import type { PageTitleLogoKey } from "@/types";

interface PageTitleProps {
  /** Wordmark artwork to show; without it the title falls back to stone-styled text. */
  logo?: PageTitleLogoKey;
  /** Fallback text when there is no artwork. */
  children?: React.ReactNode;
  className?: string;
}

/**
 * Page heading. Always a real <h1>: with artwork the image's alt text is the
 * heading name, otherwise styled text is used.
 */
export function PageTitle({ logo, children, className }: PageTitleProps) {
  if (!logo) {
    return <h1 className={cn("shadowrun-title", className)}>{children}</h1>;
  }

  const { src, width, height, alt } = PAGE_TITLE_LOGOS[logo];

  return (
    <h1
      className={cn(
        "mx-auto w-full max-w-[min(88vw,36rem)] sm:max-w-xl md:max-w-2xl",
        className,
      )}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority
        className="h-auto w-full drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)] motion-safe:animate-hero-logo-in"
      />
    </h1>
  );
}
