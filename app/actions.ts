"use server";

import { getPlayerInfo } from "@/lib/player-helpers";

export async function getPlayer(discordId: string) {
  return getPlayerInfo(discordId);
}
