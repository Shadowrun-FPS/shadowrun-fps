import NextAuth from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

// https://discord.com/developers/docs/topics/oauth2#shared-resources-oauth2-scopes
const scopes = ["identify"].join(" ");

const handler = NextAuth({
  providers: [
    DiscordProvider({
      name: "Discord",
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      // authorization: {params: {scope: scopes}},
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
