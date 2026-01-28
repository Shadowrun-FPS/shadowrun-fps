import { notFound } from "next/navigation";

// This is a catch-all route that will handle any unmatched tournament routes
export default function TournamentCatchAll() {
  // Redirect to 404 for any unmatched tournament routes
  notFound();
  return null;
}
