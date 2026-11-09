import { Metadata } from "next";

import {
  LegalContactSection,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal-page";

const DESCRIPTION =
  "Terms of use for the Shadowrun FPS community website and launcher.";

export const metadata: Metadata = {
  title: "Terms of Use",
  alternates: {
    canonical: "/terms",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Terms of Use | Shadowrun FPS",
    description: DESCRIPTION,
    url: "https://www.shadowrunfps.com/terms",
    type: "website",
    images: [
      {
        url: "https://www.shadowrunfps.com/hero-logo-bg.webp",
        width: 1200,
        height: 630,
        alt: "Shadowrun FPS",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Use | Shadowrun FPS",
    description: DESCRIPTION,
    images: ["https://www.shadowrunfps.com/hero-logo-bg.webp"],
  },
};

export default function TermsOfUse() {
  return (
    <LegalPage title="Terms of Use" logo="terms" lastUpdated="November 9, 2026">
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By using the Shadowrun FPS website or launcher (together, the
          &quot;Platform&quot;), you agree to these Terms of Use. If you do not
          agree, do not use the Platform.
        </p>
      </LegalSection>

      <LegalSection title="2. About This Project">
        <p>
          Shadowrun FPS is a community-run fan project. It is not affiliated
          with, endorsed by, or sponsored by FASA Studios, Microsoft, or the
          owners of the Shadowrun trademarks. Shadowrun and related names and
          marks belong to their respective owners.
        </p>
      </LegalSection>

      <LegalSection title="3. Use of the Platform">
        <p>
          You may use the website and launcher for personal, non-commercial
          purposes. You may not:
        </p>
        <LegalList>
          <li>Use the Platform for any commercial purpose</li>
          <li>
            Copy, redistribute, or mirror Platform files or content on another
            server without permission
          </li>
          <li>
            Decompile or reverse engineer Platform software, except where the
            law allows it
          </li>
          <li>Remove copyright or other ownership notices</li>
        </LegalList>
        <p>
          This permission ends automatically if you break these terms and may be
          ended by us at any time.
        </p>
      </LegalSection>

      <LegalSection title="4. Sign-In and Discord Membership">
        <p>
          You sign in with your Discord account. You are responsible for
          activity under your account and for following Discord&apos;s Terms of
          Service. Joining the Shadowrun FPS Discord server is required to use
          the launcher.
        </p>
      </LegalSection>

      <LegalSection title="5. Community Conduct">
        <p>
          Follow the rules of the Discord server and treat other players with
          respect. Harassment, hate speech, and discrimination are not
          tolerated. Cheating or exploiting bugs to gain an unfair advantage may
          lead to removal from the community.
        </p>
      </LegalSection>

      <LegalSection title="6. Prohibited Activities">
        <p>You agree not to:</p>
        <LegalList>
          <li>Break any local, state, national, or international law</li>
          <li>Harass, threaten, or intimidate other users</li>
          <li>Pretend to be another person or group</li>
          <li>Disrupt the Platform or the servers connected to it</li>
          <li>
            Try to gain unauthorized access to the Platform, other accounts, or
            connected systems
          </li>
          <li>
            Use bots, scrapers, or other automated tools to access the website
          </li>
          <li>Cheat or exploit bugs in the game</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="7. Your Feedback">
        <p>
          If you send us feedback or suggestions, you allow us to use them to
          improve the project without payment or credit. You are responsible for
          anything you submit.
        </p>
      </LegalSection>

      <LegalSection title="8. Downloads and Third-Party Software">
        <p>
          The launcher and game files are provided for the community&apos;s use.
          Some components come from third parties, and older versions of the
          launcher rely on legacy software such as Games for Windows Live. You
          download and run all files at your own risk.
        </p>
      </LegalSection>

      <LegalSection title="9. Disclaimer">
        <p>
          The Platform is provided &quot;as is&quot; and &quot;as
          available.&quot; We make no warranties of any kind, including
          warranties of merchantability, fitness for a particular purpose, or
          non-infringement. We do not promise that the Platform will be
          available, accurate, or free of errors.
        </p>
      </LegalSection>

      <LegalSection title="10. Limitation of Liability">
        <p>
          To the fullest extent the law allows, Shadowrun FPS and its volunteers
          are not liable for any damages, including loss of data or profit,
          arising from your use of or inability to use the Platform.
        </p>
      </LegalSection>

      <LegalSection title="11. Links">
        <p>
          We link to other sites we do not control and are not responsible for
          their content. A link is not an endorsement. Use linked sites at your
          own risk.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to These Terms">
        <p>
          We may update these terms at any time. The current version is always
          posted on this page, and continuing to use the Platform means you
          accept it.
        </p>
      </LegalSection>

      <LegalSection title="13. Governing Law">
        <p>
          These terms are governed by the laws of the State of California,
          United States, without regard to its conflict of law rules. Any
          dispute will be heard in the state or federal courts located in
          California.
        </p>
      </LegalSection>

      <LegalSection title="14. Termination">
        <p>
          We may suspend or end your access to the Platform at any time, without
          notice, including for breaking these terms. You may stop using the
          Platform at any time, or ask us to delete your account data through
          Discord.
        </p>
      </LegalSection>

      <LegalContactSection subject="these terms" />
    </LegalPage>
  );
}
