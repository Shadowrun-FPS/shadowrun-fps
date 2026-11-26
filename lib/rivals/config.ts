/** Product defaults for rival discovery. Change these together with the tests. */

export const RECENT_WINDOW_DAYS = 30;
export const RECENT_WINDOW_MS = RECENT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export const HIGHLIGHT_WINDOW_DAYS = 7;
export const HIGHLIGHT_WINDOW_MS = HIGHLIGHT_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/** Recent meetings below this stay in the opponent table only. */
export const EMERGING_MIN = 3;
/** Recent meetings above this are established rather than emerging. */
export const EMERGING_MAX = 4;
export const ESTABLISHED_MIN = 5;

/** Losing streaks of this length can break into a story and a stake. */
export const STREAK_BREAK_MIN = 3;
export const STREAK_MILESTONES = [3, 5] as const;

/** A decisive match is close when the round margin is at most this. */
export const CLOSE_MARGIN = 2;

/** Encounter volume saturates around this many recent meetings. */
export const VOLUME_TAU = 8;
/** Recency time constant, in days. */
export const RECENCY_TAU_DAYS = 14;
/** Added to the meeting count so a short series cannot outrank a long one on rate alone. */
export const CONFIDENCE_PRIOR = 4;

export const MAIN_RIVAL_WEIGHTS = {
  volume: 0.35,
  competitiveness: 0.25,
  recency: 0.25,
  close: 0.15,
} as const;

/**
 * Nemesis win rate is wins / decisive meetings <= 3/10.
 * Compared with integers so 30% is included and 1/3 is not.
 */
export const NEMESIS_WIN_RATE_NUMERATOR = 3;
export const NEMESIS_WIN_RATE_DENOMINATOR = 10;

export const DAY_MS = 24 * 60 * 60 * 1000;

export const PLAYER_ID_PATTERN = /^[a-f0-9]{24}$/;

export const RIVALS_STORAGE_KEY = "shadowrun.rivals.v1";

export const MAX_PINNED_PAIRS = 20;
export const MAX_SEEN_PLAYERS = 8;
export const MAX_SEEN_MATCHES = 500;
export const MAX_SEEN_EVENTS = 400;
export const MAX_VISIBLE_UPDATES = 12;
