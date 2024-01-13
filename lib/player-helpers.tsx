import clientPromise from "@/lib/mongodb";
import { Player } from "@/types/types";

export const getPlayerInfo = async (
  discordId: string | string[] | undefined
) => {
  try {
    // console.log("getPlayerInfo: ", discordId);
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const player = await db
      .collection("Players")
      .findOne({ discordId: discordId });
    return player as unknown as Player;
  } catch (error) {
    return null;
  }
};
