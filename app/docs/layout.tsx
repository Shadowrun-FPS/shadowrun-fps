import type { Metadata } from "next";
import { DocHero } from "@/components/doc-hero";

const DOCS_SITE_URL = "https://www.shadowrunfps.com";

/**
 * Baseline metadata for all `/docs/*` routes. Each doc page exports its own
 * `metadata` (title, description, keywords, OG) which merges with this layout.
 */
export const metadata: Metadata = {
  authors: [{ name: "Shadowrun FPS Community", url: DOCS_SITE_URL }],
  creator: "Shadowrun FPS Community",
  publisher: "Shadowrun FPS Community",
};

export default function DocsLayout({
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
