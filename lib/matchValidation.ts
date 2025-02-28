interface MatchResult {
  team1Score: number;
  team2Score: number;
  team1Players: string[];
  team2Players: string[];
  submittedBy: string;
  timestamp: Date;
}

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateMatchResult(
  result: MatchResult,
  requiredPlayers: number
): ValidationResult {
  // Check if teams have correct number of players
  if (
    result.team1Players.length !== requiredPlayers ||
    result.team2Players.length !== requiredPlayers
  ) {
    return {
      isValid: false,
      error: `Each team must have exactly ${requiredPlayers} players`,
    };
  }

  // Check for duplicate players
  const allPlayers = [...result.team1Players, ...result.team2Players];
  const uniquePlayers = new Set(allPlayers);
  if (uniquePlayers.size !== allPlayers.length) {
    return {
      isValid: false,
      error: "A player cannot be on both teams",
    };
  }

  // Check score validity
  if (result.team1Score < 0 || result.team2Score < 0) {
    return {
      isValid: false,
      error: "Scores cannot be negative",
    };
  }

  // Check for tie (if your game doesn't allow ties)
  if (result.team1Score === result.team2Score) {
    return {
      isValid: false,
      error: "Match cannot end in a tie",
    };
  }

  // Check if score is within reasonable limits
  const maxScore = 16; // Adjust based on your game rules
  if (result.team1Score > maxScore || result.team2Score > maxScore) {
    return {
      isValid: false,
      error: `Score cannot exceed ${maxScore}`,
    };
  }

  return { isValid: true };
}

export function validateMatchSubmission(
  result: MatchResult,
  submitterTeam: string[]
): ValidationResult {
  // Check if submitter is part of the match
  if (
    !result.team1Players.includes(result.submittedBy) &&
    !result.team2Players.includes(result.submittedBy)
  ) {
    return {
      isValid: false,
      error: "Only match participants can submit results",
    };
  }

  // Check if submission is within time limit
  const submissionTimeLimit = 30 * 60 * 1000; // 30 minutes in milliseconds
  const timeSinceMatch = Date.now() - result.timestamp.getTime();
  if (timeSinceMatch > submissionTimeLimit) {
    return {
      isValid: false,
      error: "Results must be submitted within 30 minutes of match completion",
    };
  }

  return { isValid: true };
}
