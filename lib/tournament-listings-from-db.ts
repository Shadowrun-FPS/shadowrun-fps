import clientPromise from "@/lib/mongodb";
import type { TournamentListing } from "@/types";

/**
 * Same data shape as GET /api/tournaments, without HTTP self-fetch.
 * Used from RSC (e.g. teams directory) so production builds don’t rely on loopback to NEXTAUTH_URL.
 */
export async function fetchTournamentListingsFromDb(): Promise<
  TournamentListing[]
> {
  const client = await clientPromise;
  const db = client.db();
  const tournaments = await db
    .collection("Tournaments")
    .find({})
    .sort({ startDate: -1 })
    .toArray();

  return tournaments.map((tournament) => {
    const withStringId = {
      ...tournament,
      _id: tournament._id.toString(),
    };
    // Match JSON response semantics (Date → ISO string) for client-serializable props
    return JSON.parse(JSON.stringify(withStringId)) as TournamentListing;
  });
}
