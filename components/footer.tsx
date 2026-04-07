"use client";

import Link from "next/link";
import { Youtube, Twitch, Instagram, Facebook } from "lucide-react";
import { getSocialUrls } from "@/lib/env";
import { useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SocialLinkConfig {
  platform: string;
  url: string;
  icon: JSX.Element;
  label: string;
  /** Short platform name for tooltip (e.g. "Discord", "YouTube") */
  tooltip: string;
}

function DiscordIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
      aria-hidden
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
      aria-hidden
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

/** X (formerly Twitter) logo - geometric X shape */
function XLogoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
      aria-hidden
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** Rumble video platform logo - play icon in rounded square */
function RumbleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-6 h-6"
      aria-hidden
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" />
    </svg>
  );
}

function buildSocialLinks(
  urls: ReturnType<typeof getSocialUrls>,
): SocialLinkConfig[] {
  const links: SocialLinkConfig[] = [];

  if (urls.discordApp || urls.discord) {
    links.push({
      platform: "discord",
      url: urls.discordApp ?? urls.discord!,
      icon: <DiscordIcon />,
      label: urls.discordApp ? "Open Discord (app)" : "Join our Discord",
      tooltip: "Discord",
    });
  }
  if (urls.tiktok) {
    links.push({
      platform: "tiktok",
      url: urls.tiktok,
      icon: <TikTokIcon />,
      label: "Follow us on TikTok",
      tooltip: "TikTok",
    });
  }
  if (urls.youtube) {
    links.push({
      platform: "youtube",
      url: urls.youtube,
      icon: <Youtube className="w-6 h-6" />,
      label: "Subscribe on YouTube",
      tooltip: "YouTube",
    });
  }
  if (urls.twitter) {
    links.push({
      platform: "twitter",
      url: urls.twitter,
      icon: <XLogoIcon />,
      label: "Follow us on X",
      tooltip: "X",
    });
  }
  if (urls.twitch) {
    links.push({
      platform: "twitch",
      url: urls.twitch,
      icon: <Twitch className="w-6 h-6" />,
      label: "Watch on Twitch",
      tooltip: "Twitch",
    });
  }
  if (urls.instagram) {
    links.push({
      platform: "instagram",
      url: urls.instagram,
      icon: <Instagram className="w-6 h-6" />,
      label: "Follow us on Instagram",
      tooltip: "Instagram",
    });
  }
  if (urls.facebook) {
    links.push({
      platform: "facebook",
      url: urls.facebook,
      icon: <Facebook className="w-6 h-6" />,
      label: "Follow us on Facebook",
      tooltip: "Facebook",
    });
  }
  if (urls.rumble) {
    links.push({
      platform: "rumble",
      url: urls.rumble,
      icon: <RumbleIcon />,
      label: "Watch us on Rumble",
      tooltip: "Rumble",
    });
  }

  return links;
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = useMemo(() => {
    const urls = getSocialUrls();
    return buildSocialLinks(urls);
  }, []);

  return (
    <footer
      className="relative z-10 w-full mt-auto text-white"
      role="contentinfo"
    >
      <div className="responsive-x-padding">
        <div className="w-full rounded-t-2xl sm:rounded-t-3xl bg-black border-t border-gray-800/80">
          <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
              {/* Copyright */}
              <p className="text-sm text-gray-500">
                &copy; {currentYear} Shadowrun FPS Community
              </p>
              {/* Social links */}
              {socialLinks.length > 0 && (
                <div
                  className="flex flex-wrap justify-center gap-2 sm:gap-3"
                  role="list"
                >
                  <TooltipProvider delayDuration={300}>
                    {socialLinks.map((link) => (
                      <Tooltip key={link.platform}>
                        <TooltipTrigger asChild>
                          <Link
                            href={link.url}
                            className="text-gray-400 transition-all hover:text-white hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={link.label}
                            role="listitem"
                          >
                            {link.icon}
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="bg-popover text-popover-foreground"
                        >
                          {link.tooltip}
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
