import { Metadata } from "next";

import {
  LegalContactSection,
  LegalList,
  LegalPage,
  LegalSection,
} from "@/components/legal-page";
import { ogImages } from "@/lib/og-images";

const DESCRIPTION =
  "How the Shadowrun FPS launcher and website handle your data when you sign in with Discord.";

export const metadata: Metadata = {
  title: "Privacy Policy",
  alternates: {
    canonical: "/privacy",
  },
  description: DESCRIPTION,
  openGraph: {
    title: "Privacy Policy | Shadowrun FPS",
    description: DESCRIPTION,
    url: "https://www.shadowrunfps.com/privacy",
    type: "website",
    images: ogImages("privacy"),
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Shadowrun FPS",
    description: DESCRIPTION,
    images: ogImages("privacy"),
  },
};

export default function PrivacyPolicy() {
  return (
    <LegalPage
      title="Privacy Policy"
      logo="privacy"
      lastUpdated="November 9, 2026"
    >
      <LegalSection title="Introduction">
        <p>
          Shadowrun FPS is a community-run project. This policy explains what
          information the Shadowrun FPS launcher and this website handle when
          you sign in with Discord, and the choices you have.
        </p>
      </LegalSection>

      <LegalSection title="Signing In With Discord">
        <p>
          The launcher and the website both use Discord OAuth2 for sign-in. You
          approve the request on Discord&apos;s own page, and we never see your
          Discord password. You can revoke access at any time in Discord under
          User Settings, then Authorized Apps.
        </p>
      </LegalSection>

      <LegalSection title="Information We Receive From Discord">
        <p>When you sign in, Discord shares the following with us:</p>
        <LegalList>
          <li>Your Discord user ID, username, display name, and avatar</li>
          <li>
            Which servers you belong to, used to confirm that you are a member
            of the Shadowrun FPS Discord server
          </li>
          <li>
            Your nickname and roles in the Shadowrun FPS server, used to show
            your name and unlock moderator or admin features
          </li>
        </LegalList>
        <p>We do not ask for your email address.</p>
      </LegalSection>

      <LegalSection title="How We Use Your Information">
        <LegalList>
          <li>To verify that you are a member of the Discord server</li>
          <li>To sign you in and keep you signed in</li>
          <li>To show your name and avatar</li>
          <li>To give moderators and admins access to management tools</li>
          <li>To keep the launcher and website secure and working</li>
        </LegalList>
      </LegalSection>

      <LegalSection title="What We Store">
        <p>
          We keep a player record containing your Discord ID, username,
          nickname, avatar link, and the dates it was created and last updated.
          Server roles are read when you sign in and held in your session. We do
          not sell your information.
        </p>
      </LegalSection>

      <LegalSection title="Cookies on the Website">
        <p>
          The website sets a sign-in cookie that keeps you signed in for up to
          30 days, along with a security cookie that protects the sign-in
          process. Both are needed for sign-in to work. If you block them, you
          are simply signed out.
        </p>
        <p>
          The home page can embed a YouTube or Twitch broadcast. Those services
          may set their own cookies under their own policies.
        </p>
      </LegalSection>

      <LegalSection title="Analytics and Hosting">
        <p>
          The website uses Vercel Web Analytics and Speed Insights, which report
          page views and loading performance in aggregate. Our hosting and
          download providers may also keep standard server logs that include IP
          addresses and browser details.
        </p>
      </LegalSection>

      <LegalSection title="Who Handles Your Data">
        <p>
          We rely on these services to run the project: Discord for sign-in,
          Vercel for website hosting, MongoDB for the player database, and
          Cloudflare for launcher downloads. Each handles data under its own
          privacy policy. Your data is stored in the United States.
        </p>
      </LegalSection>

      <LegalSection title="Data Retention and Deletion">
        <p>
          We keep your player record while you remain part of the community. To
          have it deleted, contact us on Discord. You can also stop all future
          collection by revoking the app in your Discord settings.
        </p>
      </LegalSection>

      <LegalSection title="Your Rights">
        <p>You can ask us to:</p>
        <LegalList>
          <li>Show you the information we hold about you</li>
          <li>Correct information that is wrong</li>
          <li>Delete your information</li>
          <li>Stop using your information</li>
        </LegalList>
        <p>
          California residents have these rights under California law, including
          the right to know what we collect and to request deletion. We do not
          sell or share personal information for advertising.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          Discord requires users to be at least 13 years old, and this project
          is not directed at children under 13. If you believe a child under 13
          has signed in, contact us and we will delete the record.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          We use reasonable measures to protect your information, such as
          encrypted connections and limited admin access. No online service can
          promise complete security.
        </p>
      </LegalSection>

      <LegalSection title="Changes to This Policy">
        <p>
          We may update this policy from time to time. Changes are posted on
          this page with a new &quot;Last Updated&quot; date.
        </p>
      </LegalSection>

      <LegalContactSection subject="this policy or your data" />
    </LegalPage>
  );
}
