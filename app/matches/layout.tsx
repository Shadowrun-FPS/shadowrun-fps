import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocHero } from "@/components/doc-hero";
import { CLIENT_CONFIG } from "@/lib/client-config";

export const metadata: Metadata = {
  title: "Past Matches",
  robots: { index: false, follow: false },
  // public/og/matches.jpg is ready. Attach it with ogImages("matches") when this page is public.
};

export default function MatchesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!CLIENT_CONFIG.FEATURES.MATCHES) {
    notFound();
  }

  return (
    <>
      <DocHero />
      <div>{children}</div>
    </>
  );
}
