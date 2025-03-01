import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MatchNotification({ notification }: { notification: any }) {
  return (
    <Link href={`/matches/${notification.matchId}`}>
      <Button variant="link">View Match</Button>
    </Link>
  );
}
