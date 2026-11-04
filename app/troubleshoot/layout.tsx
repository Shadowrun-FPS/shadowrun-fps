import type { Metadata } from "next";
import { DocHero } from "@/components/doc-hero";

const SITE_URL = "https://www.shadowrunfps.com";

export const metadata: Metadata = {
  authors: [{ name: "Shadowrun FPS Community", url: SITE_URL }],
  creator: "Shadowrun FPS Community",
  publisher: "Shadowrun FPS Community",
};

export default function TroubleshootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <DocHero />
      <div>{children}</div>
    </>
  );
}
