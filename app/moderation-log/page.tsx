import PublicModerationLog from "@/components/public-moderation-log";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Moderation Log | Shadowrun FPS",
  description: "Public record of moderation actions in our community",
};

export default function PublicModerationLogPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 mx-auto">
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2 min-h-[44px] sm:min-h-0">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </Link>
        </div>
        <PublicModerationLog />
      </div>
    </div>
  );
}
