import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DOWNLOADS = [
  {
    step: 1,
    title: "File archiver",
    description: "Required for extracting game files. WinRAR is not recommended.",
    href: "https://www.7-zip.org/a/7z2201-x64.exe",
    cta: "Download 7-Zip",
  },
  {
    step: 2,
    title: "Game service",
    description: "Required for game activation and online play.",
    href: "https://community.pcgamingwiki.com/files/file/1012-microsoft-games-for-windows-live/",
    cta: "Download GFWL",
  },
  {
    step: 3,
    title: "Game files",
    description: "Pre-installed and updated game package.",
    href: "https://mega.nz/file/5LdjgJQY#XMIClDPN0j0p7FrjNTGL3518OU3nrJl-xCA5W5jZZcg",
    cta: "Download Shadowrun files",
  },
] as const;

export function InstallDownloadsGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {DOWNLOADS.map((item) => (
        <div
          key={item.step}
          className={cn(
            "flex flex-col rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm transition-all",
            "hover:border-primary/25 hover:bg-card/60 hover:shadow-md"
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {item.step}
            </span>
            <h3 className="text-base font-semibold sm:text-lg">{item.title}</h3>
          </div>
          <p className="mb-4 flex-grow text-sm text-muted-foreground">
            {item.description}
          </p>
          <Button asChild className="mt-auto w-full gap-2 sm:w-fit">
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {item.cta}
              <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
            </a>
          </Button>
        </div>
      ))}
    </div>
  );
}
