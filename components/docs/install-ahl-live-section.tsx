import Link from "next/link";
import { DocCallout } from "@/components/docs/doc-callout";

const INI_GFWL = `[server]
login = "login.live.com"
as = "xeas.xboxlive.com"
macs = "xemacs.xboxlive.com"
tgs = "xetgs.xboxlive.com"`;

const INI_AHL = `[server]
login = "login.shadowrunfps.com"
as = "kdc.shadowrunfps.com"
macs = "kdc.shadowrunfps.com"
tgs = "kdc.shadowrunfps.com"`;

export function InstallAntHillLiveSection() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="space-y-3 text-sm text-muted-foreground sm:text-base">
        <p>
          <strong className="text-foreground">AntHill LIVE</strong> (
          <abbr title="AntHill LIVE" className="no-underline">
            AHL
          </abbr>
          ) is our private replacement for Games for Windows LIVE — same idea as GFWL,
          tuned for Shadowrun FPS. The launcher downloads an updated game ZIP that is{" "}
          <strong className="text-foreground">pre-configured for AHL</strong>.
        </p>
        <p>
          To play <strong className="text-foreground">online on AHL</strong>, create an
          account on AntHill LIVE and sign in from the game. If you only want offline
          play or bots, you can use a{" "}
          <strong className="text-foreground">Local Profile</strong> in-game instead —
          no AHL account required.
        </p>
      </div>

      <DocCallout variant="note" title="Launcher install">
        <p>
          The installer from our{" "}
          <Link
            href="/download"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Download
          </Link>{" "}
          page includes a setting that makes it easy to switch between{" "}
          <strong className="text-foreground">AHL</strong> and classic{" "}
          <strong className="text-foreground">GFWL</strong> (your normal Xbox-enabled
          Microsoft account). If you installed manually, use{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground sm:text-sm">
            patcher_conf.ini
          </code>{" "}
          as described below — there is no toggle in the manual ZIP workflow.
        </p>
      </DocCallout>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Manual install: switch AHL ↔ GFWL (<code className="font-mono text-base">patcher_conf.ini</code>)
        </h3>
        <p className="text-sm text-muted-foreground sm:text-base">
          Edit{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground sm:text-sm">
            patcher_conf.ini
          </code>{" "}
          inside your Shadowrun game folder (next to the game files). Replace the{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs text-foreground sm:text-sm">
            [server]
          </code>{" "}
          block with one of the following.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Configuration for classic GFWL (Xbox Live endpoints)
            </p>
            <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-4 text-xs leading-relaxed text-foreground sm:text-sm">
              <code>{INI_GFWL}</code>
            </pre>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              Configuration for AntHill LIVE (AHL)
            </p>
            <pre className="overflow-x-auto rounded-xl border border-border/60 bg-muted/40 p-4 text-xs leading-relaxed text-foreground sm:text-sm">
              <code>{INI_AHL}</code>
            </pre>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          Online play on AHL (account &amp; gamertag)
        </h3>
        <ol className="space-y-3 text-sm text-muted-foreground sm:text-base">
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            <span>
              Sign up:{" "}
              <a
                href="https://login.shadowrunfps.com/signup.srf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                login.shadowrunfps.com/signup.srf
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              2
            </span>
            <span>
              Create your gamertag:{" "}
              <a
                href="http://xbox.shadowrunfps.com:8090/NewGamertag.srf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-4 hover:underline break-all"
              >
                xbox.shadowrunfps.com:8090/NewGamertag.srf
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              3
            </span>
            <span>
              After both are created, restart your launcher (if you use it), launch
              Shadowrun, and sign in with the email and password you registered. You
              don&apos;t need a real-world email — only one you can use to sign in.
            </span>
          </li>
        </ol>
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">
          Dedicated server (community)
        </h3>
        <p className="text-sm text-muted-foreground sm:text-base">
          In-game: open{" "}
          <strong className="text-foreground">Public Matches</strong>, choose{" "}
          <strong className="text-foreground">Dedicated Servers</strong>, then the{" "}
          <strong className="text-foreground">Find All</strong> tab. Look for{" "}
          <strong className="text-foreground">Shadowrun Official Server</strong>.
        </p>
      </div>
    </div>
  );
}
