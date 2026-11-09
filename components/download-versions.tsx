import { cn } from "@/lib/utils";

type DownloadVersionsProps = {
  gameVersion: string;
  launcherVersion: string;
  /** Optional link to where release notes are posted. */
  changelogHref?: string;
  className?: string;
};

/** Launcher and game versions as inline muted text, with an optional release-notes link. */
export function DownloadVersions({
  gameVersion,
  launcherVersion,
  changelogHref,
  className,
}: DownloadVersionsProps) {
  const versions = [
    { label: "Launcher version", version: launcherVersion },
    { label: "Game version", version: gameVersion },
  ];

  return (
    <div className={cn("space-y-1 text-sm text-muted-foreground", className)}>
      <dl className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {versions.map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <dt>{item.label}:</dt>
            <dd className="font-medium text-foreground">{item.version}</dd>
          </div>
        ))}
      </dl>
      {changelogHref ? (
        <p>
          Release notes are posted in the{" "}
          <a
            href={changelogHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Discord changelog channel
          </a>
          .
        </p>
      ) : null}
    </div>
  );
}
