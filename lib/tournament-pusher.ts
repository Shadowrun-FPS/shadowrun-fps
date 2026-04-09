import Pusher from "pusher";
import { safeLog } from "@/lib/security";
import {
  TOURNAMENT_PUSHER_EVENT,
  TOURNAMENTS_LIST_PUSHER_CHANNEL,
  TOURNAMENTS_LIST_PUSHER_EVENT,
  tournamentChannelName,
} from "@/lib/tournament-realtime-constants";

let serverPusher: Pusher | null = null;

function getPusher(): Pusher | null {
  const appId = process.env.PUSHER_APP_ID;
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const secret = process.env.PUSHER_SECRET;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!appId || !key || !secret || !cluster) {
    return null;
  }
  if (!serverPusher) {
    serverPusher = new Pusher({
      appId,
      key,
      secret,
      cluster,
      useTLS: true,
    });
  }
  return serverPusher;
}

/**
 * Notify everyone on the tournament detail page to refetch.
 */
export function triggerTournamentUpdate(tournamentId: string): void {
  try {
    const pusher = getPusher();
    if (!pusher) return;
    void pusher.trigger(
      tournamentChannelName(tournamentId),
      TOURNAMENT_PUSHER_EVENT,
      { tournamentId, t: Date.now() },
    );
  } catch (err) {
    safeLog.error("tournament Pusher trigger failed:", err);
  }
}

/**
 * Notify tournaments overview (and any list subscribers) to refetch.
 */
export function triggerTournamentsListUpdate(): void {
  try {
    const pusher = getPusher();
    if (!pusher) return;
    void pusher.trigger(TOURNAMENTS_LIST_PUSHER_CHANNEL, TOURNAMENTS_LIST_PUSHER_EVENT, {
      t: Date.now(),
    });
  } catch (err) {
    safeLog.error("tournaments-list Pusher trigger failed:", err);
  }
}

/**
 * Convenience: detail + list (most mutations affect both).
 */
export function broadcastTournamentChange(tournamentId: string): void {
  triggerTournamentUpdate(tournamentId);
  triggerTournamentsListUpdate();
}
