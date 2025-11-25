/**
 * Helper functions to get the correct MongoDB collection name based on team size
 */

export function getTeamCollectionName(teamSize: number): string {
  switch (teamSize) {
    case 2:
      return "Teams2v2";
    case 3:
      return "Teams3v3";
    case 4:
      return "Teams"; // Keep "Teams" for 4v4 (backward compatibility)
    case 5:
      return "Teams5v5";
    default:
      return "Teams"; // Default to Teams for 4v4
  }
}

/**
 * Get all team collection names
 */
export function getAllTeamCollectionNames(): string[] {
  return ["Teams", "Teams2v2", "Teams3v3", "Teams5v5"];
}

/**
 * Get team collection name from a team document or teamSize value
 */
export function getCollectionFromTeam(team: { teamSize?: number } | number): string {
  const size = typeof team === "number" ? team : team.teamSize || 4;
  return getTeamCollectionName(size);
}

/**
 * Find a team by ID across all collections
 * Returns the team and the collection name it was found in
 */
export async function findTeamAcrossCollections(
  db: any,
  teamId: string,
  query?: any
): Promise<{ team: any; collectionName: string } | null> {
  const allCollections = getAllTeamCollectionNames();
  const { ObjectId } = await import("mongodb");
  
  for (const collectionName of allCollections) {
    let team;
    if (query) {
      team = await db.collection(collectionName).findOne(query);
    } else if (ObjectId.isValid(teamId)) {
      team = await db.collection(collectionName).findOne({ _id: new ObjectId(teamId) });
    } else {
      team = await db.collection(collectionName).findOne({ tag: teamId });
    }
    
    if (team) {
      return { team, collectionName };
    }
  }
  
  return null;
}

