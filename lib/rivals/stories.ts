import { ESTABLISHED_MIN, STREAK_BREAK_MIN, STREAK_MILESTONES } from "@/lib/rivals/config";
import { resultFor } from "@/lib/rivals/pairs";
import type { RivalEncounter, RivalSeries, RivalStoryEvent, SeriesRecord, SeriesStreak } from "@/types/rivals";

const COUNT_WORDS = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
];

function countWord(count: number): string {
  return COUNT_WORDS[count] ?? String(count);
}

function eventId(
  pairKey: string,
  type: RivalStoryEvent["type"],
  matchId: string,
  extra?: string,
): string {
  return extra
    ? `${pairKey}:${type}:${extra}:${matchId}`
    : `${pairKey}:${type}:${matchId}`;
}

export function buildStoryEvents(series: RivalSeries): RivalStoryEvent[] {
  const [lowId] = series.playerIds;
  const events: RivalStoryEvent[] = [];
  let winsLow = 0;
  let winsHigh = 0;
  let streakLow = 0;
  let decisivePlayed = 0;
  let worstTrailLow: { low: number; high: number; deficit: number } | null = null;
  let worstTrailHigh: { low: number; high: number; deficit: number } | null = null;

  series.encounters.forEach((encounter, index) => {
    const meetingNumber = index + 1;
    const base = {
      matchId: encounter.matchId,
      finishedAt: encounter.finishedAt,
      winsLowBefore: winsLow,
      winsHighBefore: winsHigh,
    };

    if (meetingNumber === 1) {
      events.push({
        ...base,
        id: eventId(series.pairKey, "first_encounter", encounter.matchId),
        type: "first_encounter",
        winsLow,
        winsHigh,
      });
    }

    if (meetingNumber === ESTABLISHED_MIN) {
      events.push({
        ...base,
        id: eventId(series.pairKey, "established", encounter.matchId),
        type: "established",
        winsLow,
        winsHigh,
      });
    }

    const lowSeat = encounter.seats.find((seat) => seat.id === lowId);
    if (!lowSeat || !encounter.decisive || encounter.winningTeam == null) return;

    const lowWon = lowSeat.team === encounter.winningTeam;
    const before = { winsLow, winsHigh, streakLow, decisivePlayed };
    if (lowWon) {
      winsLow += 1;
      streakLow = streakLow > 0 ? streakLow + 1 : 1;
    } else {
      winsHigh += 1;
      streakLow = streakLow < 0 ? streakLow - 1 : -1;
    }
    decisivePlayed += 1;

    const after = {
      matchId: encounter.matchId,
      finishedAt: encounter.finishedAt,
      winsLow,
      winsHigh,
      winsLowBefore: before.winsLow,
      winsHighBefore: before.winsHigh,
    };

    if (winsLow === winsHigh && winsLow > 0) {
      events.push({
        ...after,
        id: eventId(series.pairKey, "series_tied", encounter.matchId),
        type: "series_tied",
      });
    }

    const wasTied = before.winsLow === before.winsHigh && before.decisivePlayed > 0;
    if (wasTied && winsLow !== winsHigh) {
      const side = winsLow > winsHigh ? "low" : "high";
      events.push({
        ...after,
        id: eventId(series.pairKey, "lead_taken", encounter.matchId, side),
        type: "lead_taken",
        side,
      });
    }

    const lowTookLead = before.winsLow <= before.winsHigh && winsLow > winsHigh;
    const highTookLead = before.winsHigh <= before.winsLow && winsHigh > winsLow;
    if (lowTookLead && worstTrailLow) {
      events.push({
        ...after,
        id: eventId(series.pairKey, "comeback_lead", encounter.matchId, "low"),
        type: "comeback_lead",
        side: "low",
        trailWinsLow: worstTrailLow.low,
        trailWinsHigh: worstTrailLow.high,
      });
      worstTrailLow = null;
    }
    if (highTookLead && worstTrailHigh) {
      events.push({
        ...after,
        id: eventId(series.pairKey, "comeback_lead", encounter.matchId, "high"),
        type: "comeback_lead",
        side: "high",
        trailWinsLow: worstTrailHigh.low,
        trailWinsHigh: worstTrailHigh.high,
      });
      worstTrailHigh = null;
    }

    if (winsLow < winsHigh) {
      const deficit = winsHigh - winsLow;
      if (!worstTrailLow || deficit >= worstTrailLow.deficit) {
        worstTrailLow = { low: winsLow, high: winsHigh, deficit };
      }
    }
    if (winsHigh < winsLow) {
      const deficit = winsLow - winsHigh;
      if (!worstTrailHigh || deficit >= worstTrailHigh.deficit) {
        worstTrailHigh = { low: winsLow, high: winsHigh, deficit };
      }
    }

    const broken = lowWon
      ? before.streakLow <= -STREAK_BREAK_MIN
        ? -before.streakLow
        : 0
      : before.streakLow >= STREAK_BREAK_MIN
        ? before.streakLow
        : 0;
    if (broken >= STREAK_BREAK_MIN) {
      events.push({
        ...after,
        id: eventId(series.pairKey, "streak_broken", encounter.matchId, lowWon ? "low" : "high"),
        type: "streak_broken",
        side: lowWon ? "low" : "high",
        brokenStreak: broken,
      });
    }

    const winnerStreak = lowWon ? streakLow : -streakLow;
    if ((STREAK_MILESTONES as readonly number[]).includes(winnerStreak)) {
      events.push({
        ...after,
        id: eventId(
          series.pairKey,
          "streak_milestone",
          encounter.matchId,
          `${lowWon ? "low" : "high"}-${winnerStreak}`,
        ),
        type: "streak_milestone",
        side: lowWon ? "low" : "high",
        milestone: winnerStreak as 3 | 5,
      });
    }
  });

  return events;
}

function score(wins: number, losses: number): string {
  return `${wins}–${losses}`;
}

export function storyText(
  event: RivalStoryEvent,
  viewerId: string,
  series: RivalSeries,
  nameFor: (playerId: string) => string,
): string {
  const viewerIsLow = series.playerIds[0] === viewerId;
  const opponentId = viewerIsLow ? series.playerIds[1] : series.playerIds[0];
  const opponent = nameFor(opponentId);
  const viewerWins = viewerIsLow ? event.winsLow : event.winsHigh;
  const opponentWins = viewerIsLow ? event.winsHigh : event.winsLow;
  const viewerBefore = viewerIsLow ? event.winsLowBefore : event.winsHighBefore;
  const opponentBefore = viewerIsLow ? event.winsHighBefore : event.winsLowBefore;
  const viewerSide = viewerIsLow ? "low" : "high";
  const aboutViewer = event.side === viewerSide;

  switch (event.type) {
    case "first_encounter":
      return "First recorded encounter.";
    case "established":
      return "This rivalry reached 5 recorded encounters.";
    case "series_tied":
      return `Series tied at ${score(viewerWins, opponentWins)} in the recorded history.`;
    case "lead_taken":
      return aboutViewer
        ? `You took a ${score(viewerWins, opponentWins)} lead after a tie in the recorded history.`
        : `${opponent} took a ${score(opponentWins, viewerWins)} lead after a tie in the recorded history.`;
    case "comeback_lead": {
      const trailViewer = viewerIsLow
        ? (event.trailWinsLow ?? viewerBefore)
        : (event.trailWinsHigh ?? viewerBefore);
      const trailOpponent = viewerIsLow
        ? (event.trailWinsHigh ?? opponentBefore)
        : (event.trailWinsLow ?? opponentBefore);
      return aboutViewer
        ? `From ${score(trailViewer, trailOpponent)} down to a ${score(viewerWins, opponentWins)} series lead in the recorded history.`
        : `${opponent} went from ${score(trailOpponent, trailViewer)} down to a ${score(opponentWins, viewerWins)} series lead in the recorded history.`;
    }
    case "streak_broken": {
      const length = countWord(event.brokenStreak ?? STREAK_BREAK_MIN);
      return aboutViewer
        ? `${length.charAt(0).toUpperCase()}${length.slice(1)}-match losing streak broken.`
        : `${opponent} broke a ${length}-match losing streak.`;
    }
    case "streak_milestone": {
      const length = countWord(event.milestone ?? 3);
      return aboutViewer
        ? `Your winning streak reached ${length} in the recorded history.`
        : `${opponent}'s winning streak reached ${length} in the recorded history.`;
    }
    default:
      return "Recorded series update.";
  }
}

export function nextEncounterStakes(
  record: SeriesRecord,
  streak: SeriesStreak,
): string[] {
  if (record.meetings <= 0) return [];
  const stakes: string[] = [];
  if (record.losses === record.wins + 1) {
    stakes.push("Win your next encounter to tie the series.");
  } else if (record.wins === record.losses) {
    stakes.push("Your next encounter decides who leads.");
  } else if (record.wins === record.losses + 1) {
    stakes.push("Defend your one-match series lead.");
  }
  if (streak.kind === "loss" && streak.length >= STREAK_BREAK_MIN) {
    const length = countWord(streak.length);
    stakes.push(`A win would end your ${length}-match losing streak.`);
  }
  return stakes;
}

export function decisiveResults(
  encounters: RivalEncounter[],
  playerId: string,
): Array<"win" | "loss"> {
  const results: Array<"win" | "loss"> = [];
  for (const encounter of encounters) {
    const result = resultFor(encounter, playerId);
    if (result === "win" || result === "loss") results.push(result);
  }
  return results;
}
