import Image from "next/image";

import { cn } from "@/lib/utils";

interface HeroLogoProps {
  /** Logo image; defaults to the flat title art used on the landing hero. */
  src?: string;
  width?: number;
  height?: number;
  className?: string;
}

/** Shadowrun art title as its own layer; fades in and slowly zooms (static for reduced motion). */
export function HeroLogo({
  src = "/title-wordmark.webp",
  width = 800,
  height = 147,
  className,
}: HeroLogoProps) {
  return (
    <Image
      src={src}
      alt="Shadowrun FPS"
      width={width}
      height={height}
      priority
      className={cn(
        "mx-auto h-auto w-full max-w-[min(80vw,34rem)] drop-shadow-[0_4px_24px_rgba(0,0,0,0.6)] motion-safe:animate-hero-logo-in sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
        className,
      )}
    />
  );
}
