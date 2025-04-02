import { Button } from "@/components/ui/button";
import Link from "next/link";

// Convert the component to a proper React functional component
export function MyTeam({ team }: { team: any }) {
  return (
    <div className="flex gap-2 mt-4">
      <Button variant="default" className="w-full" asChild>
        <Link href={`/tournaments/teams/${team._id}`}>View Details</Link>
      </Button>
    </div>
  );
}
