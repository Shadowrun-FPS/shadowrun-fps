import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { getGuildData } from "@/lib/discord-helpers";
import clientPromise from "@/lib/mongodb";

// Only keep the DiscordProfile interface and ROLE_IDs
interface DiscordProfile {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string | null;
  verified?: boolean;
  global_name?: string | null;
  display_name?: string | null;
  banner?: string | null;
}

const ROLE_IDS = {
  ADMIN: "932585751332421642",
  FOUNDER: "1095126043918082109",
  MOD: "1042168064805965864",
  GM: "1080979865345458256",
} as const;

// Add a type interface for the guild data structure
interface GuildData {
  nick?: string | null;
  user?: {
    id: string;
    username: string;
    global_name?: string | null;
    avatar?: string | null;
  };
}

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: { scope: "identify guilds guilds.members.read" },
      },
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
      if (account) {
        token.accessToken = account.access_token;
      }
      if (trigger === "signIn") {
        const guildData = await getGuildData(token.accessToken as string);
        token.guild = guildData as GuildData; // Add type assertion

        // Store the correct Discord nickname from guild data with null checks
        const discordId = (guildData as any)?.user?.id || "";
        const discordUsername = (guildData as any)?.user?.username || "";

        // Ensure nickname is never null, always a string
        const discordNickname = (
          guildData?.nick ||
          (guildData as any)?.user?.global_name ||
          (guildData as any)?.user?.username ||
          ""
        ).toString();

        const discordProfilePicture = (guildData as any)?.user?.avatar
          ? `https://cdn.discordapp.com/avatars/${(guildData as any).user.id}/${
              (guildData as any).user.avatar
            }.png`
          : null;

        // Update player data with correct nickname
        const client = await clientPromise;
        const db = client.db("ShadowrunWeb");

        await db.collection("Players").updateOne(
          { discordId },
          {
            $set: {
              discordId,
              discordUsername,
              discordNickname: discordNickname || discordUsername, // Ensure fallback
              discordProfilePicture,
              updatedAt: new Date(),
            },
          },
          { upsert: true }
        );
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord") {
        // We'll handle player data storage in the jwt callback
        return true;
      }
      return true;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub!;

        // Add nickname to session with proper optional chaining
        if (token.guild) {
          session.user.nickname =
            (token.guild as GuildData)?.nick ||
            (token.guild as any)?.user?.global_name ||
            (token.guild as any)?.user?.username ||
            session.user.name ||
            "Unknown User";
        } else {
          try {
            const client = await clientPromise;
            const db = client.db("ShadowrunWeb");
            const player = await db
              .collection("Players")
              .findOne({ discordId: token.sub });
            if (player) {
              session.user.nickname = player.discordNickname;
            } else {
              session.user.nickname = session.user.name || "Unknown User";
            }
          } catch (error) {
            console.error("Error fetching player nickname:", error);
            // Fallback to existing user name if there's an error
            session.user.nickname = session.user.name || "Unknown User";
          }
        }
      }
      return session;
    },
  },
};
