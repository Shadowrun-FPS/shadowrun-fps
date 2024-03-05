import { getGuildData, upsertPlayerDiscordData } from "@/lib/discord-helpers";
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
    async jwt({ token, account, trigger }) {
      // Persist the OAuth access_token and or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
      }
      if (trigger === "signIn") {
        const guildData = await getGuildData(token.accessToken as string);
        token.guild = guildData;
        // upsert player table with guild data
        const discordId = guildData.user.id;
        const discordNickname = guildData.nick;
        const discordProfilePicture = `https://cdn.discordapp.com/avatars/${guildData.user.id}/${guildData.user.avatar}.png`;
        upsertPlayerDiscordData(
          discordId,
          discordNickname,
          discordProfilePicture
        );
      }
      return token;
    },
    async signIn() {
      // Return true to allow sign in
      return true;
    },
    async session({ session, token }) {
      // console.log("session", { session, user, token });
      if (session.user !== undefined && token.guild !== undefined) {
        const { user, ...guild } = token.guild;
        const userId = user.id;
        session.user = {
          ...session.user,
          id: userId,
          global_name: user.global_name,
          nickname: guild.nick ?? user.global_name ?? user?.name,
        };
        session.user.guild = guild;
      }
      // Send properties to the client, like an access_token from a provider
      return session;
    },
  },
});

export { handler as GET, handler as POST };
