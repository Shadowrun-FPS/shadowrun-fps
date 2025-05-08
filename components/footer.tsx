"use client";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/utils";

// Define social links interface
interface SocialLink {
  platform: string;
  url: string;
  icon: JSX.Element;
  label: string;
  hidden?: boolean;
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
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

const socialLinks: SocialLink[] = [
  {
    platform: "discord",
    url: "discord://discord.com/servers/this-is-shadowrun-930362820627943495",
    icon: <DiscordIcon />,
    label: "Join our Discord community",
  },
];

export function Footer() {
  const { toast } = useToast();
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "Events", href: "/docs/events" },
    { name: "Install Guide", href: "/docs/install" },
    { name: "Troubleshoot", href: "/docs/troubleshoot" },
  ];

  const handleComingSoon = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: string
  ) => {
    e.preventDefault();
    toast({
      title: "Coming Soon",
      description: `${page} is currently under development.`,
      duration: 3000,
    });
  };

  return (
    <footer className="w-full text-white bg-black">
      <div className="py-4 border-t border-gray-800">
        <div className="responsive-container">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-8">
              <p className="text-sm text-gray-400">
                &copy; {currentYear} Shadowrun FPS Community
              </p>
              <div className="flex items-center space-x-4">
                {socialLinks
                  .filter((link) => !link.hidden)
                  .map((link) => (
                    <Link
                      key={link.platform}
                      href={link.url}
                      className="text-gray-400 transition-all hover:text-white hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={link.label}
                    >
                      <span className="sr-only">{link.label}</span>
                      {link.icon}
                    </Link>
                  ))}
              </div>
            </div>
            <nav className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <a
                href="#"
                onClick={(e) => handleComingSoon(e, "Privacy Policy")}
                className="text-sm text-gray-400 transition-colors cursor-not-allowed hover:text-white opacity-60"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                onClick={(e) => handleComingSoon(e, "Terms")}
                className="text-sm text-gray-400 transition-colors cursor-not-allowed hover:text-white opacity-60"
              >
                Terms
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
