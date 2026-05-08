"use client";

import dynamic from "next/dynamic";
import { IdleMount } from "@/components/idle-mount";

const FloatingPlayer = dynamic(
  () => import("@/components/floating-player").then((m) => m.FloatingPlayer),
  { ssr: false }
);

export function HomeFloatingPlayer() {
  return (
    <IdleMount delayMs={600}>
      <FloatingPlayer audioSrc="/baiana.mp3" trackTitle="Baiana" duration={29} />
    </IdleMount>
  );
}

