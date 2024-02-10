import clientPromise from "./mongodb";

export async function getGuildData(accessToken: string | undefined) {
  try {
    if (accessToken === undefined) {
      throw new Error("No access token provided");
    }
    const response = await fetch(
      "https://discord.com/api/users/@me/guilds/930362820627943495/member",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-cache",
      }
    );

    if (!response.ok) throw new Error("Failed to fetch guild data");
    const data = await response.json();
    return data;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function upsertPlayerDiscordData(
  discordId: string,
  discordNickname: string,
  discordProfilePicture: string
) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");
    const result = await db.collection("Players").updateOne(
      { discordId },
      {
        $set: {
          discordId,
          discordNickname,
          discordProfilePicture,
        },
        $setOnInsert: {
          stats: [],
        },
      },
      { upsert: true }
    );
    return result;
  } catch (error) {
    console.log(error);
    return null;
  }
}
