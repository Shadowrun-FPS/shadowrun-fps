export { RIVALS_STORAGE_KEY } from "@/lib/rivals/config";
export {
  buildRivalIndex,
  canonicalPairKey,
  currentStreak,
  encountersInWindow,
  formatEncounterScore,
  formatSeriesScore,
  mapRecords,
  parsePairParam,
  playerName,
  resultFor,
  rivalIndexFromPayload,
  seriesRecord,
} from "@/lib/rivals/pairs";
export {
  explainEmerging,
  explainMainRival,
  explainNemesis,
  mainRivalByPlayer,
  opponentSummaries,
  selectFeatured,
  tableBadge,
} from "@/lib/rivals/rank";
export { buildStoryEvents, nextEncounterStakes, storyText } from "@/lib/rivals/stories";
export { rivalPerformance } from "@/lib/rivals/performance";
export { captureSeen, updatesSinceLastSeen, advanceSeen } from "@/lib/rivals/updates";
export {
  emptyRivalsPreference,
  mergeRivalsPreferences,
  readRivalsPreference,
  sanitizeRivalsPreference,
  writeRivalsPreference,
} from "@/lib/rivals/preferences";
