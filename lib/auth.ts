import { AuthOptions, DefaultSession } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { DefaultJWT } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { signIn } from "next-auth/react";
import { NextAuthOptions } from "next-auth";
import {
  upsertPlayerDiscordData,
  getGuildData,
  updatePlayerGuildNickname,
} from "./discord-helpers";

// Grant admin access to this specific user regardless of roles
const DEVELOPER_ID = "238329746671271936"; // Your Discord ID

// Add your Discord ID to the list of admin IDs
const ADMIN_IDS = [DEVELOPER_ID /* other admin IDs */];
const MODERATOR_IDS = [DEVELOPER_ID /* other mod IDs */];

// Add this type definition at the top of your file
interface DiscordProfile {
  id: string;
  username: string;
  avatar: string;
  discriminator: string;
  public_flags: number;
  flags: number;
  banner: string | null;
  accent_color: number | null;
  global_name: string;
  avatar_decoration_data: any;
  banner_color: string;
  mfa_enabled: boolean;
  locale: string;
  premium_type: number;
  email: string;
  verified: boolean;
}

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

export const authOptions: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify guilds guilds.members.read",
        },
      },
      profile(profile) {
        // Log the raw profile in development
        if (process.env.NODE_ENV === "development") {
          console.log("Discord profile:", profile);
        }

        if (profile.avatar === null) {
          const defaultAvatarNumber = parseInt(profile.discriminator) % 5;
          profile.image_url = `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }

        return {
          id: profile.id,
          name: profile.username,
          email: profile.email,
          image: profile.image_url,
          // Make sure we're capturing global_name
          global_name: profile.global_name || null,
          nickname: null, // This will be set by the Discord API call to get member details
        };
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
    async jwt({ token, account, profile }) {
      if (account) {
        token.accessToken = account.access_token;

        // Get basic Discord data
        if (profile) {
          // Cast profile to DiscordProfile type
          const discordProfile = profile as unknown as DiscordProfile;

          token.id = discordProfile.id;
          token.name = discordProfile.username;
          token.image = `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`;

          // Store basic info with global username
          await upsertPlayerDiscordData(
            discordProfile.id,
            discordProfile.username,
            token.image as string
          );

          // Now get and update the guild-specific nickname
          if (account.access_token) {
            console.log("Fetching guild data during auth for user:", token.id);
            const guildData = await getGuildData(account.access_token);

            if (guildData && guildData.nick) {
              // Use the guild nickname if available
              const guildNickname = guildData.nick;
              console.log(
                `Found guild nickname: "${guildNickname}" for user ${token.id}`
              );
              token.nickname = guildNickname;
            } else if (discordProfile.global_name) {
              // Fallback to global display name
              console.log(
                `Using global name: "${discordProfile.global_name}" for user ${token.id}`
              );
              token.nickname = discordProfile.global_name;
            } else {
              // Final fallback to username
              console.log(
                `Using username as fallback: "${discordProfile.username}" for user ${token.id}`
              );
              token.nickname = discordProfile.username;
            }
          }
        }

        // Always grant admin access to developer account
        if (token.id === DEVELOPER_ID) {
          token.isAdmin = true;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.image = token.image as string;
        session.accessToken = token.accessToken as string;

        // Make sure nickname is passed from token to session
        session.user.nickname = token.nickname;

        // Always grant admin access to developer account
        if (session.user.id === DEVELOPER_ID) {
          session.user.isAdmin = true;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Only proceed for Discord sign-ins
      if (account?.provider === "discord") {
        try {
          // Get user data
          const { id: discordId, name, image } = user;

          // Access token is needed to get guild data
          const accessToken = account.access_token;

          // Get guild data to find server-specific nickname
          let discordNickname = null;

          if (accessToken) {
            console.log(`Fetching guild data during signIn for ${discordId}`);
            const guildData = await getGuildData(accessToken);

            if (guildData && guildData.nick) {
              // Use guild nickname if available (highest priority)
              discordNickname = guildData.nick;
              console.log(
                `Using guild nickname "${discordNickname}" for user ${discordId}`
              );
            } else if (user.global_name) {
              // Fallback to global name
              discordNickname = user.global_name;
              console.log(
                `No guild nickname found. Using global name "${discordNickname}" for user ${discordId}`
              );
            } else {
              // Final fallback to username
              discordNickname = name;
              console.log(
                `No guild or global nickname found. Using username "${discordNickname}" for user ${discordId}`
              );
            }
          } else {
            // No access token available, use name as fallback
            discordNickname = name;
            console.log(
              `No access token available. Using username "${discordNickname}" for user ${discordId}`
            );
          }

          const discordUsername = name;
          const discordProfilePicture = image;

          // Connect directly to the database
          const { db } = await connectToDatabase();

          // Update or create player document
          await db.collection("Players").updateOne(
            { discordId },
            {
              $set: {
                discordNickname, // Use the properly determined nickname
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

          // Log what was saved
          console.log(
            `Updated player ${discordId} with nickname "${discordNickname}"`
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
