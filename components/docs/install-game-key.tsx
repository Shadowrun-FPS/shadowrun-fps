import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { DocCallout } from "@/components/docs/doc-callout";

const COMMUNITY_KEYGEN_URL = "https://gfwl-hub.vercel.app/download";

export function InstallGameKeySection() {
  return (
    <div className="space-y-6 sm:space-y-8">
      <DocCallout variant="note" title="Easier activation (recommended)">
        <p>
          You don&apos;t need a{" "}
          <strong className="text-foreground">retail activation key</strong>.
          Two easier options: use our{" "}
          <Link href="/download" className="font-medium text-primary underline-offset-4 hover:underline">
            community launcher
          </Link>
          , or the separate{" "}
          <a
            href={COMMUNITY_KEYGEN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            community keygen (GFWL Hub)
          </a>
          . Both avoid buying a Steam title just for a legacy GFWL key. The Steam
          key steps below are here if you still want a retail key or need a
          fallback.
        </p>
      </DocCallout>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6">
        <a
          href="https://store.steampowered.com/app/15620/Warhammer_40000_Dawn_of_War_II/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/30 shadow-sm transition-all hover:border-primary/35 hover:bg-muted/15 hover:shadow-md">
            <Image
              src="/dawnofwar2.jpg"
              alt="Dawn of War II"
              width={400}
              height={300}
              loading="lazy"
              className="h-auto w-full object-cover transition-opacity group-hover:opacity-95"
            />
            <div className="flex items-center gap-3 p-3 sm:p-4">
              <p className="min-w-0 flex-1 text-base font-semibold leading-snug underline-offset-4 decoration-transparent transition-[color,text-decoration-color] group-hover:text-primary group-hover:underline group-hover:decoration-primary/50 sm:text-lg">
                Warhammer 40,000: Dawn of War II
              </p>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </div>
          </div>
        </a>
        <a
          href="https://store.steampowered.com/app/10460/The_Club/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <div className="overflow-hidden rounded-2xl border border-border/60 bg-card/30 shadow-sm transition-all hover:border-primary/35 hover:bg-muted/15 hover:shadow-md">
            <Image
              src="/TheClub.jpg"
              alt="The Club"
              width={400}
              height={300}
              loading="lazy"
              className="h-auto w-full object-cover transition-opacity group-hover:opacity-95"
            />
            <div className="flex items-center gap-3 p-3 sm:p-4">
              <p className="min-w-0 flex-1 text-base font-semibold leading-snug underline-offset-4 decoration-transparent transition-[color,text-decoration-color] group-hover:text-primary group-hover:underline group-hover:decoration-primary/50 sm:text-lg">
                The Club
              </p>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                aria-hidden
              />
            </div>
          </div>
        </a>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Key information</h3>
        <div className="grid gap-6">
          <div>
            <h4 className="mb-3 font-semibold text-foreground">
              Getting your key
            </h4>
            <ol className="space-y-2.5">
              {[
                "Purchase any compatible game on Steam",
                "Right-click the game in your library",
                "Select Manage → CD Keys",
                "Copy the Legacy GFWL key",
              ].map((text, i) => (
                <li key={text} className="flex items-start gap-2">
                  <span className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{text}</span>
                </li>
              ))}
            </ol>
          </div>
          <DocCallout variant="note" title="Key usage">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>Each key can be used up to 10 times.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>Keys can be shared until depleted.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60" />
                <span>
                  Keys are tied to your PCID. Changing PC hardware may require
                  re-activation.
                </span>
              </li>
            </ul>
          </DocCallout>
        </div>
      </div>
    </div>
  );
}
