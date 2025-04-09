import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | Shadowrun FPS",
  description: "Terms of use for Shadowrun FPS platform",
};

export default function TermsOfUse() {
  return (
    <div className="container max-w-4xl py-12">
      <h1 className="mb-8 text-4xl font-bold tracking-tight">Terms of Use</h1>

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
          <h2 className="mb-4 text-2xl font-semibold">
            1. Acceptance of Terms
          </h2>
          <p>
            By accessing or using the Shadowrun FPS platform
            (&quot;Platform&quot;), you agree to be bound by these Terms of Use
            and all applicable laws and regulations. If you do not agree with
            any of these terms, you are prohibited from using or accessing this
            site.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">2. Use License</h2>
          <p>
            Permission is granted to temporarily use the Platform for personal,
            non-commercial transitory viewing and participation in tournaments.
            This is the grant of a license, not a transfer of title, and under
            this license you may not:
          </p>
          <ul className="pl-6 mt-2 mb-4 list-disc">
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>
              Attempt to decompile or reverse engineer any software contained on
              the Platform
            </li>
            <li>
              Remove any copyright or other proprietary notations from the
              materials
            </li>
            <li>
              Transfer the materials to another person or &quot;mirror&quot; the
              materials on any other server
            </li>
          </ul>
          <p>
            This license shall automatically terminate if you violate any of
            these restrictions and may be terminated by Shadowrun FPS at any
            time.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">3. User Accounts</h2>
          <p>
            To access certain features of the Platform, you may be required to
            create an account. You are responsible for maintaining the
            confidentiality of your account information, including your
            password, and for all activity that occurs under your account. You
            agree to notify us immediately of any unauthorized use of your
            account.
          </p>
          <p className="mt-2">
            When creating an account, you agree to provide accurate, current,
            and complete information. You also agree not to impersonate anyone,
            misrepresent your identity or affiliation with any person or entity,
            or create a false identity.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            4. Tournament Rules and Conduct
          </h2>
          <p>
            Participants in tournaments must adhere to the specific rules and
            guidelines for each tournament. Shadowrun FPS reserves the right to
            disqualify any participant from a tournament for misconduct,
            cheating, or violation of tournament rules.
          </p>
          <p className="mt-2">
            We expect all participants to maintain good sportsmanship and
            respectful behavior towards other players, spectators, and
            tournament officials. Harassment, hate speech, or any form of
            discriminatory behavior will not be tolerated.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">5. User Content</h2>
          <p>
            Users may post content such as team profiles, tournament comments,
            and forum posts. You retain ownership of all content you submit, but
            grant Shadowrun FPS a worldwide, non-exclusive, royalty-free license
            to use, reproduce, modify, adapt, publish, translate, and distribute
            your content in any existing or future media.
          </p>
          <p className="mt-2">
            You represent and warrant that your content does not violate any
            third-party rights, including copyright, trademark, privacy, or
            other personal or proprietary rights.
          </p>
          <p className="mt-2">
            Shadowrun FPS reserves the right to remove any content that violates
            these Terms or is otherwise objectionable at our sole discretion.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            6. Prohibited Activities
          </h2>
          <p>You agree not to engage in any of the following activities:</p>
          <ul className="pl-6 mt-2 mb-4 list-disc">
            <li>
              Using the service for any illegal purpose or in violation of any
              local, state, national, or international law
            </li>
            <li>Harassing, threatening, or intimidating other users</li>
            <li>
              Impersonating any person or entity, or falsely stating or
              otherwise misrepresenting your affiliation with a person or entity
            </li>
            <li>
              Interfering with or disrupting the Platform or servers or networks
              connected to the Platform
            </li>
            <li>
              Attempting to gain unauthorized access to parts of the Platform,
              other accounts, computer systems, or networks connected to the
              Platform
            </li>
            <li>
              Using any robot, spider, scraper, or other automated means to
              access the Platform
            </li>
            <li>Cheating or exploiting bugs in tournaments or games</li>
            <li>
              Engaging in any activity that could disable, overburden, or impair
              the functioning of the Platform
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">7. Disclaimer</h2>
          <p>
            The materials on the Platform are provided on an &apos;as is&apos;
            basis. Shadowrun FPS makes no warranties, expressed or implied, and
            hereby disclaims and negates all other warranties including, without
            limitation, implied warranties or conditions of merchantability,
            fitness for a particular purpose, or non-infringement of
            intellectual property or other violation of rights.
          </p>
          <p className="mt-2">
            Shadowrun FPS does not warrant or make any representations
            concerning the accuracy, likely results, or reliability of the use
            of the materials on the Platform or otherwise relating to such
            materials or on any resources linked to this Platform.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">8. Limitations</h2>
          <p>
            In no event shall Shadowrun FPS or its suppliers be liable for any
            damages (including, without limitation, damages for loss of data or
            profit, or due to business interruption) arising out of the use or
            inability to use the materials on the Platform, even if Shadowrun
            FPS or a Shadowrun FPS authorized representative has been notified
            orally or in writing of the possibility of such damage.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            9. Revisions and Errata
          </h2>
          <p>
            The materials appearing on the Platform could include technical,
            typographical, or photographic errors. Shadowrun FPS does not
            warrant that any of the materials on the Platform are accurate,
            complete, or current. Shadowrun FPS may make changes to the
            materials contained on the Platform at any time without notice.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">10. Links</h2>
          <p>
            Shadowrun FPS has not reviewed all of the sites linked to its
            Platform and is not responsible for the contents of any such linked
            site. The inclusion of any link does not imply endorsement by
            Shadowrun FPS of the site. Use of any such linked website is at the
            user&apos;s own risk.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">
            11. Modifications to Terms of Use
          </h2>
          <p>
            Shadowrun FPS may revise these Terms of Use for the Platform at any
            time without notice. By using this Platform, you are agreeing to be
            bound by the then current version of these Terms of Use.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">12. Governing Law</h2>
          <p>
            These terms and conditions are governed by and construed in
            accordance with the laws and you irrevocably submit to the exclusive
            jurisdiction of the courts in that location.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold">13. Termination</h2>
          <p>
            We may terminate or suspend your account and bar access to the
            Platform immediately, without prior notice or liability, under our
            sole discretion, for any reason whatsoever and without limitation,
            including but not limited to a breach of the Terms.
          </p>
          <p className="mt-2">
            If you wish to terminate your account, you may simply discontinue
            using the Platform or contact us to request account deletion.
          </p>
        </section>

        <section className="mb-8">
          {/* <h2 className="mb-4 text-2xl font-semibold">14. Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us
            through our Discord server or by email at:{" "}
            <a
              href="mailto:terms@shadowrunfps.com"
              className="text-primary hover:underline"
            >
              terms@shadowrunfps.com
            </a>
          </p> */}
        </section>
      </div>
    </div>
  );
}
