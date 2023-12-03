import { Player } from "./types";

export type AddPlayerRequest = {
  action: "addPlayer";
  matchId: string;
  player: Player;
};
