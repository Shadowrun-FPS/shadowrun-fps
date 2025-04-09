import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Shadowrun FPS",
  description: "Privacy policy for Shadowrun FPS platform users",
};

export default function PrivacyPolicy() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="mb-8 text-4xl font-bold tracking-tight">Privacy Policy</h1>

      <div className="prose prose-invert max-w-none">
        <p className="mb-8 text-xl text-muted-foreground">
          Last Updated:{" "}
          {new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Introduction</h2>
          <p>
            Welcome to Shadowrun FPS. We respect your privacy and are committed
            to protecting your personal data. This privacy policy will inform
            you about how we look after your personal data when you visit our
            website and participate in our tournaments, regardless of where you
            visit it from, and tell you about your privacy rights and how the
            law protects you.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">The Data We Collect</h2>
          <p>
            We may collect, use, store and transfer different kinds of personal
            data about you which we have grouped together as follows:
          </p>
          <ul className="pl-6 mt-2 mb-4 list-disc">
            <li>
              <strong>Identity Data</strong>: includes username, Discord ID,
              gamertag, or similar identifier.
            </li>
            <li>
              <strong>Contact Data</strong>: includes email address and Discord
              contact information.
            </li>
            <li>
              <strong>Profile Data</strong>: includes your preferences,
              feedback, and survey responses.
            </li>
            <li>
              <strong>Technical Data</strong>: includes internet protocol (IP)
              address, browser type and version, time zone setting and location,
              operating system and platform, and other technology on the devices
              you use to access this website.
            </li>
            <li>
              <strong>Usage Data</strong>: includes information about how you
              use our website and services.
            </li>
            <li>
              <strong>Tournament Data</strong>: includes team memberships,
              tournament participation history, match results, and ELO/ranking
              information.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">How We Use Your Data</h2>
          <p>We use your data for the following purposes:</p>
          <ul className="pl-6 mt-2 mb-4 list-disc">
            <li>To register you as a new user</li>
            <li>To process and manage your participation in tournaments</li>
            <li>To manage our relationship with you</li>
            <li>To administer and protect our website</li>
            <li>To deliver relevant content and events to you</li>
            <li>
              To make suggestions and recommendations to you about tournaments
              or features that may interest you
            </li>
            <li>To measure and analyze the effectiveness of our services</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your
            personal data from being accidentally lost, used, or accessed in an
            unauthorized way, altered, or disclosed. We limit access to your
            personal data to those employees, agents, contractors, and other
            third parties who have a business need to know.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Data Retention</h2>
          <p>
            We will only retain your personal data for as long as reasonably
            necessary to fulfill the purposes we collected it for, including for
            the purposes of satisfying any legal, regulatory, tax, accounting,
            or reporting requirements.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Your Legal Rights</h2>
          <p>
            Under certain circumstances, you have rights under data protection
            laws in relation to your personal data, including the right to:
          </p>
          <ul className="pl-6 mt-2 mb-4 list-disc">
            <li>Request access to your personal data</li>
            <li>Request correction of your personal data</li>
            <li>Request erasure of your personal data</li>
            <li>Object to processing of your personal data</li>
            <li>Request restriction of processing your personal data</li>
            <li>Request transfer of your personal data</li>
            <li>Right to withdraw consent</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Third-Party Services</h2>
          <p>
            Our service integrates with Discord for authentication and
            communication purposes. When you connect your Discord account, we
            receive basic profile information according to Discord&apos;s
            privacy policy and OAuth2 authentication system.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">Cookies and Tracking</h2>
          <p>
            We use cookies and similar tracking technologies to track activity
            on our website and hold certain information. Cookies are files with
            a small amount of data which may include an anonymous unique
            identifier. You can instruct your browser to refuse all cookies or
            to indicate when a cookie is being sent.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            Changes to This Privacy Policy
          </h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the &quot;Last Updated&quot; date at the top of this
            page.
          </p>
        </section>

        <section className="mb-8">
          {/* <h2 className="mb-4 text-2xl font-semibold">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us through our Discord server or by email at:{" "}
            <a
              href="mailto:privacy@shadowrunfps.com"
              className="text-primary hover:underline"
            >
              privacy@shadowrunfps.com
            </a>
          </p> */}
        </section>
      </div>
    </div>
  );
}
