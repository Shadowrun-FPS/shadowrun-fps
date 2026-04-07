import { MessageCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISCORD_HREF =
  "discord://discord.com/servers/this-is-shadowrun-930362820627943495";

interface TroubleshootDiscordCtaProps {
  title: string;
  description: string;
  buttonLabel?: string;
}

export function TroubleshootDiscordCta({
  title,
  description,
  buttonLabel = "Get help on Discord",
}: TroubleshootDiscordCtaProps) {
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/10 p-5 shadow-sm sm:p-6">
      <h3 className="text-lg font-semibold text-foreground sm:text-xl">
        {title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground sm:text-base">
        {description}
      </p>
      <Button asChild className="mt-4 gap-2">
        <a href={DISCORD_HREF}>
          <MessageCircle className="h-4 w-4" aria-hidden />
          {buttonLabel}
          <ChevronRight className="h-4 w-4 opacity-80" aria-hidden />
        </a>
      </Button>
    </div>
  );
}
