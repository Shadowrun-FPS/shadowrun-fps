import type { ReactNode } from "react";

import { PageTitle } from "@/components/page-title";
import { DISCORD_SERVER_HREF } from "@/lib/community-links";
import type { PageTitleLogoKey } from "@/types";

type LegalPageProps = {
  title: string;
  /** Wordmark artwork for the page heading. */
  logo: PageTitleLogoKey;
  /** Fixed date the text last changed, e.g. "November 9, 2026". */
  lastUpdated: string;
  children: ReactNode;
};

/** Shared shell for the privacy and terms pages. */
export function LegalPage({
  title,
  logo,
  lastUpdated,
  children,
}: LegalPageProps) {
  return (
    <div className="container max-w-4xl py-12">
      <PageTitle logo={logo} className="mb-8">
        {title}
      </PageTitle>
      <div className="prose prose-invert max-w-none">
        <p className="mb-8 text-xl text-muted-foreground">
          Last Updated: {lastUpdated}
        </p>
        {children}
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8 space-y-2">
      <h2 className="mb-4 text-2xl font-semibold">{title}</h2>
      {children}
    </section>
  );
}

export function LegalList({ children }: { children: ReactNode }) {
  return <ul className="mt-2 mb-4 list-disc pl-6">{children}</ul>;
}

/** "Contact Us" section shared by both legal pages. Contact is through Discord only. */
export function LegalContactSection({ subject }: { subject: string }) {
  return (
    <LegalSection title="Contact Us">
      <p>
        If you have questions about {subject}, contact the moderators through
        our{" "}
        <a href={DISCORD_SERVER_HREF} className="text-primary hover:underline">
          Discord server
        </a>
        .
      </p>
    </LegalSection>
  );
}
