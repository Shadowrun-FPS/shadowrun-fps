"use client";

import PublicModerationLog from "@/components/public-moderation-log";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PublicModerationLogPage() {
  const router = useRouter();
  const [hasReferrer, setHasReferrer] = useState(false);

  useEffect(() => {
    // Check if page was opened from another page (has referrer)
    // If document.referrer is empty, page was opened directly or in new tab
    setHasReferrer(!!document.referrer && document.referrer !== window.location.href);
  }, []);

  const handleBack = () => {
    if (hasReferrer) {
      // Go back to previous page if there's a referrer
      router.back();
    } else {
      // Fallback to home page if opened directly or in new tab
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 mx-auto">
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 min-h-[44px] sm:min-h-0"
            onClick={handleBack}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">
              {hasReferrer ? "Back" : "Back to Home"}
            </span>
            <span className="sm:hidden">Back</span>
          </Button>
        </div>
        <PublicModerationLog />
      </div>
    </div>
  );
}
