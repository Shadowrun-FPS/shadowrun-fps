import { BASE_URL } from "@/lib/baseurl";
import { getGuildData } from "@/lib/discord-helpers";
import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

// https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
const scopes = ["identify", "guilds", "guilds.members.read"].join(" ");

const handler = NextAuth({
  providers: [
    DiscordProvider({
      name: "Discord",
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: { params: { scope: scopes } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, trigger, session }) {
      console.log({ token, account, trigger, session });
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      if (trigger === "signIn") {
        const guildData = await getGuildData(token.accessToken as string);
        console.log("guildData: ", guildData);
        token.guildData = guildData;
      }
      return token;
    },
    async signIn({ user, account, profile, email, credentials }) {
      // console.log("sign in", { user, account, profile, email, credentials });
      // Return true to allow sign in
      return true;
    },
    async session({ session, user, token }) {
      console.log("session", { session, user, token });
      // session.guildData = token.guildData;
      // Send properties to the client, like an access_token from a provider
      return session;
    },
    //   async session({ session, token }) {
    //     if (session?.user) {
    //       console.log(
    //         "grabbing discord member info session User: ",
    //         session.user
    //       );
    //       const bearerMsg = `Bearer ${token.accessToken}`;
    //       try {
    //         const discordFetchResult = await fetch(
    //           "https://discord.com/api/users/@me/guilds/930362820627943495/member",
    //           {
    //             method: "GET",
    //             headers: {
    //               Authorization: bearerMsg,
    //             },
    //             cache: "no-cache",
    //           }
    //         );
    //         if (!discordFetchResult.ok) {
    //           console.log("Failed to fetch discord info from callback");
    //         }
    //         const discordMemberInfo = await discordFetchResult.json();

    //         const mongoFetchResult = await fetch(
    //           BASE_URL + `/api/players/${discordMemberInfo.user.id}`,
    //           {
    //             method: "POST",
    //             headers: {
    //               "Content-Type": "application/json",
    //             },
    //             body: JSON.stringify({
    //               action: "update",
    //               data: {
    //                 discordNickname: discordMemberInfo.nick,
    //                 discordProfilePicture: session.user.image,
    //               },
    //             }),
    //           }
    //         );
    //         if (!discordFetchResult.ok) {
    //           throw new Error(
    //             "Failed to update MongoDB with latest Discord Info"
    //           );
    //         }
    //       } catch (error) {
    //         console.log(error);
    //       }
    //     }
    //     return session;
    //   },
  },
});

export { handler as GET, handler as POST };
