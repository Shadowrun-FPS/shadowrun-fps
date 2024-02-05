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
