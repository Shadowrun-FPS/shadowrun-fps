export async function getGuildData(accessToken: string | undefined) {
  if (accessToken === undefined) {
    throw new Error("No access token provided");
  }
  fetch("https://discord.com/api/users/@me/guilds/930362820627943495/member", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-cache",
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch guild data");
      }
      return response.json();
    })
    .catch((error) => {
      throw new Error(error);
    });
}
