import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import Link from "next/link";

interface ScrimmageCardProps {
  scrimmage: any;
  isTeamACaptain: boolean;
  isTeamBCaptain: boolean;
  onUpdate?: () => void;
}

export function ScrimmageCard({
  scrimmage,
  isTeamACaptain,
  isTeamBCaptain,
  onUpdate,
}: ScrimmageCardProps) {
  return (
    <>
      {scrimmage.status === "accepted" && (
        <div className="mt-4">
          <Button variant="default" size="sm" asChild>
            <Link
              href={`/tournaments/scrimmages/${
                scrimmage.scrimmageId || scrimmage._id
              }`}
            >
              View Match
            </Link>
          </Button>
        </div>
      )}

      {(isTeamACaptain || isTeamBCaptain) &&
        scrimmage.status !== "completed" && (
          <Button
            variant="destructive"
            size="sm"
            onClick={async () => {
              try {
                const response = await fetch(
                  `/api/scrimmages/${scrimmage._id}/cancel`,
                  {
                    method: "POST",
                  }
                );

                if (response.ok) {
                  toast({
                    title: "Challenge Canceled",
                    description: "The scrimmage has been canceled.",
                  });
                  // Refresh the page or update the UI
                  if (onUpdate) onUpdate();
                } else {
                  throw new Error("Failed to cancel challenge");
                }
              } catch (error) {
                toast({
                  title: "Error",
                  description:
                    "Failed to cancel the challenge. Please try again.",
                  variant: "destructive",
                });
              }
            }}
          >
            Cancel Challenge
          </Button>
        )}
    </>
  );
}
