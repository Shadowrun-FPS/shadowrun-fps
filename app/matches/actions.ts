"use server";
import {
  addMatch,
  removePlayerFromQueue,
  addPlayerToQueue,
  markPlayerAsReady,
  getReadyCheckTime,
  handleCreateMatch,
  getMatch,
  pickMaps,
  updateMatch,
} from "@/lib/match-helpers";
import { uuid } from "uuidv4";
import { revalidateTag } from "next/cache";
import { Match, MatchPlayer, Player, TeamNumber, Map } from "@/types/types";
import { getPlayersInfo } from "@/lib/player-helpers";

export async function handleSubmit(values: any) {
  const newMatch = {
    ...values,
    matchId: uuid(),
    teamSize: values["teamSize"][0],
    status: "queue",
    createdBy: "grimz", // TODO grab current users username
    createdTS: Date.now(),
    maps: [],
    players: [],
  };
  const response = await addMatch(newMatch);
  return response;
}

export async function handleJoinQueue(queueId: string, player: MatchPlayer) {
  const response = await addPlayerToQueue(queueId, player);
  // TODO: remove players from other queues if one they are in starts
  revalidateTag("queues");
  console.log("Add Player to Queue Response", response);
  return JSON.parse(JSON.stringify(response));
}

export async function handleLeaveQueue(
  queueId: string,
  playerDiscordId: string
) {
  const response = await removePlayerFromQueue(queueId, playerDiscordId);
  revalidateTag("queues");
  return response;
}

export async function triggerMatchStart(
  queue: any,
  selectedPlayers: MatchPlayer[]
) {
  const response = await handleCreateMatch(queue, selectedPlayers);
  revalidateTag("queues");
  return response;
}

export async function handleReadyCheck(
  matchId: string,
  discordId: string,
  isReady: boolean
) {
  const response = await markPlayerAsReady(matchId, discordId, isReady);
  revalidateTag("readycheck_" + matchId);
  // TODO: initiate start match logic if all players are ready
  const match = await getMatch(matchId);
  if (match?.players.every((p) => p.isReady)) {
    console.log("All players are ready, starting match");
    handleMatchMaking(match);
    // navigate to match page
  }
  return response;
}

export async function getMatchReadyCheck(matchId: string) {
  const readyCheck = await getReadyCheckTime(matchId);
  return readyCheck;
}

export async function handleMatchMaking(match: Match) {
  // console.log("Starting match making", match.matchId);
  const { players, teamSize } = match;

  const matchPlayers = await createBalancedTeams(players, teamSize);
  match.players = matchPlayers;
  const maps = (await pickMaps()) as unknown as Map[];
  match.maps = maps;
  await updateMatch(match);
}

async function createBalancedTeams(
  matchPlayers: MatchPlayer[],
  teamSize: number
) {
  const players = await getPlayersInfo(matchPlayers.map((p) => p.discordId));
  if (players?.length === 0 || players === null)
    throw new Error("No players found");

  players.sort(
    (a, b) => getEloForTeamSize(b, teamSize) - getEloForTeamSize(a, teamSize)
  );

  const teams: [Player[], Player[]] = [[], []];

  players.forEach((player) => {
    const teamElos = teams.map((team) =>
      team.reduce((total, p) => total + getEloForTeamSize(p, teamSize), 0)
    );
    const teamIndex = teamElos[0] > teamElos[1] ? 1 : 0;
    teams[teamIndex].push(player);
  });

  matchPlayers.forEach((p) => {
    const teamIndex = teams.findIndex((t) =>
      t.some((player) => player.discordId === p.discordId)
    );
    p.team = `Team ${teamIndex + 1}` as TeamNumber;
  });

  return matchPlayers;
}

const getEloForTeamSize = (player: Player, teamSize: number): number => {
  const stat = player.stats.find((s) => s.teamSize === teamSize);
  return stat ? stat.elo : 0;
};
