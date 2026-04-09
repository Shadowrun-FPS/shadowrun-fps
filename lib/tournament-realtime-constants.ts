/** Shared with client + server — public Pusher channels (no auth). */

export const TOURNAMENT_PUSHER_EVENT = "updated";

export function tournamentChannelName(tournamentId: string): string {
  return `tournament-${tournamentId}`;
}

export const TOURNAMENTS_LIST_PUSHER_CHANNEL = "tournaments-list";
export const TOURNAMENTS_LIST_PUSHER_EVENT = "updated";
