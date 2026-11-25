import { Download } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  CHANGELOG_CHANNEL_URL,
  LAUNCHER_SETUP_URL,
  PORTABLE_LAUNCHER_URL,
} from "@/lib/download-urls";

const installSteps = [
  {
    title: "Download & Install",
    body: (
      <>
        Download the{" "}
        <a
          href={LAUNCHER_SETUP_URL}
          className="font-semibold text-foreground underline-offset-4 hover:underline"
        >
          launcher
        </a>{" "}
        and run the installer.
      </>
    ),
  },
  {
    title: "Sign In",
    body: (
      <>
        Open the launcher and sign in with{" "}
        <strong className="font-semibold text-foreground">Discord</strong>.
      </>
    ),
  },
  {
    title: "Play",
    body: (
      <>
        Follow the launcher setup prompts, then click{" "}
        <strong className="font-semibold text-foreground">Play</strong>.
      </>
    ),
  },
] as const;

export default function DownloadPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <section>
        <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Installation
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Release notes are posted in the{" "}
          <a
            href={CHANGELOG_CHANNEL_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Discord changelog channel
          </a>
          .
        </p>

        <Button
          asChild
          size="lg"
          className="mt-6 h-12 w-full text-base sm:w-auto"
        >
          <a href={LAUNCHER_SETUP_URL}>
            <Download aria-hidden />
            Download launcher
          </a>
        </Button>

        <ol className="mt-8 space-y-6">
          {installSteps.map((step, index) => (
            <li key={step.title}>
              <p className="text-base font-semibold text-primary sm:text-lg">
                Step {index + 1}: {step.title}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground sm:text-base">
                {step.body}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-sm leading-relaxed text-foreground sm:text-base">
          <strong className="font-semibold">Discord server membership</strong> is
          required. Updates and repair tools are built in.
        </p>
      </section>

      <section className="mt-10 border-t border-border/40 pt-6">
        <h3 className="text-base font-semibold text-foreground">
          Prefer the old launcher?
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          The previous community launcher, which uses GFWL (Games for Windows
          Live), is still available if you would rather not use the new
          launcher, which removes GFWL.
        </p>
        <Button asChild variant="outline" size="sm" className="mt-3">
          <a href={PORTABLE_LAUNCHER_URL}>
            <Download aria-hidden />
            Download old community launcher
          </a>
        </Button>
      </section>
    </div>
  );
}
