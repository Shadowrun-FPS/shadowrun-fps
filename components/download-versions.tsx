import { cn } from "@/lib/utils";

type DownloadVersionsProps = {
  gameVersion: string;
  launcherVersion: string;
  className?: string;
};

/** Launcher and game versions as two inline lines of muted text. */
export function DownloadVersions({
  gameVersion,
  launcherVersion,
  className,
}: DownloadVersionsProps) {
  const versions = [
    { label: "Launcher version", version: launcherVersion },
    { label: "Game version", version: gameVersion },
  ];

  return (
    <dl
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground",
        className
      )}
    >
      {versions.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <dt>{item.label}:</dt>
          <dd className="font-medium text-foreground">{item.version}</dd>
        </div>
      ))}
    </dl>
  );
}
