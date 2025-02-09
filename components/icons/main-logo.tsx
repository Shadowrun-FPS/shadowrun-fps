"use client";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

type MainLogoProps = {
  className?: string;
};

function MainLogo({ className }: MainLogoProps) {
  return (
    <Link
      className={cn(
        "flex items-center gap-2 sm:gap-4 shrink-0 transition-opacity hover:opacity-90",
        className
      )}
      href="/"
    >
      <Image
        src="/serverIcon.png"
        alt="Shadowrun Icon"
        width={32}
        height={32}
        className="w-8 h-8 sm:w-10 sm:h-10"
      />
      <Image
        className="hidden md:block w-auto h-8 sm:h-10"
        src="/title.png"
        alt="Shadowrun Title"
        width={240}
        height={170}
        priority
      />
    </Link>
  );
}

export default MainLogo;
