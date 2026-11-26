import { HIGHLIGHT_WINDOW_MS } from "@/lib/rivals/config";
import { playerName, resultFor } from "@/lib/rivals/pairs";
import { buildStoryEvents, storyText } from "@/lib/rivals/stories";
import type {
  RivalEncounter,
  RivalIndex,
  RivalSeries,
  RivalUpdate,
  SeenSnapshot,
} from "@/types/rivals";

export function seenMatchKey(pairKey: string, matchId: string): string {
  return `${pairKey}:${matchId}`;
}

export function encounterFingerprint(
  encounter: RivalEncounter,
  playerId: string,
): string {
  const seat = encounter.seats.find((entry) => entry.id === playerId);
  const opponents = encounter.seats
    .map((entry) => entry.id)
    .filter((id) => id !== playerId)
    .sort()
    .join(".");
  const winner = encounter.decisive ? String(encounter.winningTeam) : "unresolved";
  return `${winner}|${encounter.score[0]}-${encounter.score[1]}|${seat?.team ?? "x"}|${encounter.map}|${opponents}`;
}

export function captureSeen(
  index: RivalIndex,
  playerId: string,
  mainRivalId: string | null,
): SeenSnapshot {
  const matches: Record<string, string> = {};
  const eventIds: string[] = [];

  for (const pairKey of index.pairKeysByPlayer.get(playerId) ?? []) {
    const series = index.seriesByKey.get(pairKey);
    if (!series) continue;
    for (const encounter of series.encounters) {
      matches[seenMatchKey(series.pairKey, encounter.matchId)] = encounterFingerprint(
        encounter,
        playerId,
      );
    }
    for (const event of buildStoryEvents(series)) {
      eventIds.push(event.id);
    }
  }

  return {
    snapshotUpdatedAt: index.updatedAt,
    matches,
    eventIds,
    mainRivalId,
  };
}

function resultWord(encounter: RivalEncounter, playerId: string): string {
  const result = resultFor(encounter, playerId);
  if (result === "win") return "win";
  if (result === "loss") return "loss";
  return "result unavailable";
}

export function updatesSinceLastSeen(
  index: RivalIndex,
  playerId: string,
  seen: SeenSnapshot | null,
  mainRivalId: string | null,
): { firstVisit: boolean; items: RivalUpdate[] } {
  const seriesList = (index.pairKeysByPlayer.get(playerId) ?? [])
    .map((pairKey) => index.seriesByKey.get(pairKey))
    .filter((series): series is RivalSeries => series != null);

  if (!seen) {
    const all = seriesList.flatMap((series) =>
      buildStoryEvents(series).map((event) => ({ series, event })),
    );
    const recent = all.filter(
      (entry) => index.asOfMs - Date.parse(entry.event.finishedAt) <= HIGHLIGHT_WINDOW_MS,
    );
    const chosen = (recent.length > 0 ? recent : all).sort((left, right) =>
      right.event.finishedAt.localeCompare(left.event.finishedAt),
    );

    return {
      firstVisit: true,
      items: chosen.slice(0, 5).map(({ series, event }) => ({
        id: `highlight:${event.id}`,
        kind: "highlight",
        text: storyText(event, playerId, series, (id) => playerName(index, id)),
        pairKey: series.pairKey,
        finishedAt: event.finishedAt,
      })),
    };
  }

  const seenEvents = new Set(seen.eventIds);
  const items: RivalUpdate[] = [];
  const newMatchIds = new Set<string>();
  const correctedMatchIds = new Set<string>();

  for (const series of seriesList) {
    for (const encounter of series.encounters) {
      const key = seenMatchKey(series.pairKey, encounter.matchId);
      const previous = seen.matches[key];
      const next = encounterFingerprint(encounter, playerId);
      if (previous == null) newMatchIds.add(encounter.matchId);
      else if (previous !== next) correctedMatchIds.add(encounter.matchId);
    }
  }

  for (const series of seriesList) {
    for (const event of buildStoryEvents(series)) {
      if (seenEvents.has(event.id)) continue;
      if (event.type === "first_encounter" && newMatchIds.has(event.matchId)) continue;
      items.push({
        id: `event:${event.id}`,
        kind: "event",
        text: storyText(event, playerId, series, (id) => playerName(index, id)),
        pairKey: series.pairKey,
        finishedAt: event.finishedAt,
      });
    }
  }

  const eventMatchIds = new Set(
    items
      .filter((item) => item.kind === "event" && item.id.includes(":"))
      .map((item) => item.id.slice(item.id.lastIndexOf(":") + 1)),
  );

  for (const series of seriesList) {
    for (const encounter of series.encounters) {
      if (!newMatchIds.has(encounter.matchId) || eventMatchIds.has(encounter.matchId)) {
        continue;
      }
      if (items.some((item) => item.id === `encounter:${encounter.matchId}`)) continue;
      items.push({
        id: `encounter:${encounter.matchId}`,
        kind: "encounter",
        text: `New recorded meeting: ${resultWord(encounter, playerId)}.`,
        pairKey: series.pairKey,
        finishedAt: encounter.finishedAt,
      });
    }
  }

  for (const matchId of correctedMatchIds) {
    const series = seriesList.find((entry) =>
      entry.encounters.some((encounter) => encounter.matchId === matchId),
    );
    const encounter = series?.encounters.find((entry) => entry.matchId === matchId);
    items.push({
      id: `corrected:${matchId}`,
      kind: "corrected",
      text: "A recorded result was corrected.",
      pairKey: series?.pairKey,
      finishedAt: encounter?.finishedAt,
    });
  }

  if (seen.mainRivalId !== mainRivalId) {
    items.push({
      id: `main:${mainRivalId ?? "none"}`,
      kind: "main_rival",
      text: mainRivalId
        ? `Your Main Rival is now ${playerName(index, mainRivalId)}.`
        : "You no longer have a Main Rival in the last 30 days.",
    });
  }

  items.sort((left, right) => (right.finishedAt ?? "").localeCompare(left.finishedAt ?? ""));
  return { firstVisit: false, items };
}

/**
 * First visits adopt the whole snapshot after the highlights render.
 * Later visits only consume updates that were actually listed.
 */
export function advanceSeen(
  previous: SeenSnapshot | null,
  current: SeenSnapshot,
  displayed: RivalUpdate[],
): SeenSnapshot {
  if (!previous) return current;

  const matches = { ...previous.matches };
  const eventIds = new Set(previous.eventIds);
  let mainRivalId = previous.mainRivalId;

  const takeMatch = (matchId: string | undefined) => {
    if (!matchId) return;
    const suffix = `:${matchId}`;
    for (const [key, fingerprint] of Object.entries(current.matches)) {
      if (key.endsWith(suffix)) matches[key] = fingerprint;
    }
  };

  for (const item of displayed) {
    if (item.kind === "highlight" || item.kind === "event") {
      const prefix = item.kind === "highlight" ? "highlight:" : "event:";
      eventIds.add(item.id.slice(prefix.length));
      takeMatch(item.id.slice(item.id.lastIndexOf(":") + 1));
    } else if (item.kind === "encounter" || item.kind === "corrected") {
      takeMatch(item.id.slice(item.id.lastIndexOf(":") + 1));
    } else if (item.kind === "main_rival") {
      mainRivalId = current.mainRivalId;
    }
  }

  return {
    snapshotUpdatedAt: current.snapshotUpdatedAt,
    matches,
    eventIds: [...eventIds],
    mainRivalId,
  };
}
