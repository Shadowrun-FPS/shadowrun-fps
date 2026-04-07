import { DocCallout } from "@/components/docs/doc-callout";

export function InstallStepsTimeline() {
  return (
    <div className="relative">
      <div
        className="pointer-events-none absolute left-[0.65rem] top-3 bottom-3 w-px bg-gradient-to-b from-primary/50 via-primary/25 to-primary/40 sm:left-[0.85rem]"
        aria-hidden
      />
      <ol className="relative space-y-10 sm:space-y-12">
        <li className="relative pl-10 sm:pl-12">
          <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-bold text-primary-foreground shadow-sm sm:h-8 sm:w-8 sm:text-sm">
            1
          </div>
          <h3 className="mb-3 text-lg font-semibold">
            Install{" "}
            <a
              href="https://community.pcgamingwiki.com/files/file/1012-microsoft-games-for-windows-live/"
              className="text-primary underline-offset-4 hover:underline"
            >
              Games For Windows Live
            </a>
          </h3>
          <ul className="space-y-2.5 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>Extract the GFWL folder</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>Run &quot;gfwllivesetup.exe&quot; as administrator.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>
                <strong className="text-foreground">Note: </strong>The
                &quot;Connection Error&quot; after install is normal and can be
                ignored.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>
                You don&apos;t need to launch GFWL program after installing.
              </span>
            </li>
          </ul>
        </li>

        <li className="relative pl-10 sm:pl-12">
          <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-bold text-primary-foreground shadow-sm sm:h-8 sm:w-8 sm:text-sm">
            2
          </div>
          <h3 className="mb-3 text-lg font-semibold">
            Install{" "}
            <a
              href="https://mega.nz/file/5LdjgJQY#XMIClDPN0j0p7FrjNTGL3518OU3nrJl-xCA5W5jZZcg"
              className="text-primary underline-offset-4 hover:underline"
            >
              Shadowrun DXVK
            </a>
          </h3>
          <ul className="space-y-2.5 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>
                Extract &quot;Shadowrun DXVK (2.3).zip&quot; using 7-Zip.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>
                Drag and drop or extract the Shadowrun folder to your desired
                location.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>
                Create shortcut of Shadowrun.exe if you want a desktop
                shortcut.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>
                Install any required DirectX components, if prompted.
              </span>
            </li>
          </ul>
        </li>

        <li className="relative pl-10 sm:pl-12">
          <div className="absolute left-0 top-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-primary text-xs font-bold text-primary-foreground shadow-sm sm:h-8 sm:w-8 sm:text-sm">
            3
          </div>
          <h3 className="mb-3 text-lg font-semibold">First launch</h3>
          <ul className="space-y-2.5 text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>Double click the Shadowrun.exe to launch the game.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>
                Configure Windows compatibility settings by clicking
                &apos;Run&apos;, if prompted.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>Press Home (or Fn+Home) to open the GFWL overlay.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>
                Click &quot;Use existing LIVE profile&quot; to sign in to your
                Microsoft account.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
              <span>Enter your key when prompted.</span>
            </li>
          </ul>
          <div className="mt-4">
            <DocCallout variant="warning" title="Activation can take a while">
              <p>
                First-time activation may take up to 20 minutes after the key
                entry page.
              </p>
            </DocCallout>
          </div>
        </li>
      </ol>
    </div>
  );
}
