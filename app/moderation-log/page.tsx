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
    <div className="container max-w-6xl px-4 py-8 mx-auto md:px-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <PublicModerationLog />
    </div>
  );
}
