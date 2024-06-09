export type TimerMap = {
  [matchId: string]: number;
};
// Temporary in-memory storage for active timers
const activeTimers: TimerMap = {};

export function getTimer(matchId: string) {
  return activeTimers[matchId];
}

export function setTimer(matchId: string, time: number) {
  activeTimers[matchId] = time;
}
