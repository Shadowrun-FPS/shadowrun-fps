"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type MainLogoProps = {
  className?: string;
};

function MainLogo({ className }: MainLogoProps) {
  const pathname = usePathname();

  const handleLogoClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Link
      className={cn(
        "flex items-center justify-center min-w-[44px] min-h-[44px] gap-2 sm:gap-4 shrink-0 transition-opacity hover:opacity-90 active:scale-95",
        className
      )}
      href="/"
      onClick={handleLogoClick}
      aria-label="Shadowrun FPS - Home"
    >
      {/* Circular icon: hidden on smallest mobile, show from sm (with title) */}
      <Image
        src="/serverIcon.png"
        unoptimized
        alt=""
        width={32}
        height={32}
        className="hidden sm:block w-8 h-8 sm:w-10 sm:h-10"
        aria-hidden
      />
      {/* Title: only logo on small mobile; from sm shown next to icon */}
      <Image
        className="w-auto h-6 sm:h-8 xl:h-10 max-h-8 sm:max-h-none"
        src="/title.png"
        alt="Shadowrun"
        width={240}
        height={170}
        priority
      />
    </Link>
  );
}

export default MainLogo;
