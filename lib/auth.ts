import { AuthOptions, DefaultSession } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { DefaultJWT } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { signIn } from "next-auth/react";

// Add your Discord ID to the list of admin IDs
const ADMIN_IDS = ["238329746671271936"]; // Your Discord ID
const MODERATOR_IDS = ["238329746671271936"]; // Your Discord ID

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isAdmin?: boolean;
      nickname?: string;
      roles?: string[];
      accessToken?: string;
    };
  }
}

declare module "next-auth/jwt" {
  // Reduce the size of this type
  type DiscordGuildData = {
    id: string;
    name: string;
  };

  interface JWT extends DefaultJWT {
    id?: string;
    accessToken?: string;
    isAdmin?: boolean;
    nickname?: string;
    roles?: string[];
    // Store less data in token
    discordGuilds?: Array<{ id: string; name: string }>;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID || "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
      authorization: {
        params: {
          // Limit scope to only what's essential
          scope: "identify",
        },
      },
    }),
  ],
  // Use JWT sessions instead of database
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  // Use smaller cookies
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.isAdmin = token.isAdmin;
        session.user.nickname = token.nickname as string;
        session.user.roles = token.roles as string[];
      }

      return session;
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.id = user.id;
        token.accessToken = account.access_token;

        // Try to get Discord information
        if (account.provider === "discord" && account.access_token) {
          try {
            // Get user data from Discord API
            const userResponse = await fetch(
              "https://discord.com/api/users/@me",
              {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                },
              }
            );

            const userData = await userResponse.json();
            token.nickname = userData.global_name || userData.username || "";

            // Store Discord ID on the token
            token.id = userData.id;

            // Only fetch guilds if absolutely needed
            // And store minimal data
            /*
            const guildsResponse = await fetch(
              "https://discord.com/api/users/@me/guilds",
              {
                headers: {
                  Authorization: `Bearer ${account.access_token}`,
                },
              }
            );

            if (guildsResponse.ok) {
              const guilds = await guildsResponse.json();
              token.discordGuilds = guilds.map(g => ({ 
                id: g.id, 
                name: g.name 
              }));
            }
            */

            // Initialize roles array
            token.roles = [];

            // Add admin role if user ID is in ADMIN_IDS
            if (ADMIN_IDS.includes(userData.id)) {
              token.roles.push("admin");
            }

            if (MODERATOR_IDS.includes(userData.id)) {
              token.roles.push("moderator");
            }

            if (process.env.NEXT_PUBLIC_DEBUG_AUTH === "true") {
              console.log("JWT callback:", {
                userId: userData.id,
                timestamp: new Date().toISOString(),
              });
            }
          } catch (error) {
            console.error("Error fetching Discord data:", error);
          }
        }
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      // Only proceed for Discord sign-ins
      if (account?.provider === "discord") {
        try {
          // Get user data
          const { id: discordId, name, image } = user;
          const discordNickname = user.name;
          const discordUsername =
            user.email?.split("@")[0] || name?.toLowerCase();
          const discordProfilePicture = image;

          // Connect directly to the database
          const { db } = await connectToDatabase();

          // Update or create player document
          await db.collection("Players").updateOne(
            { discordId },
            {
              $set: {
                discordNickname,
                discordUsername,
                discordProfilePicture,
                updatedAt: new Date().toISOString(),
              },
              $setOnInsert: {
                stats: [],
                createdAt: new Date().toISOString(),
              },
            },
            { upsert: true }
          );
        } catch (error) {
          console.error("Error updating player document:", error);
          // Don't block sign-in if this fails
        }
      }

      return true; // Allow sign-in
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
};
