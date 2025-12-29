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

import { SECURITY_CONFIG } from "./security-config";
import { safeLog } from "./security";

// Grant admin access to this specific user regardless of roles
const DEVELOPER_ID = SECURITY_CONFIG.DEVELOPER_ID;

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

          // Now get and update the guild-specific nickname and roles
          if (account.access_token) {
            const guildData = await getGuildData(account.access_token);

            if (guildData) {
              // Set roles from guild data
              token.roles = guildData.roles || [];

              if (guildData.nick) {
                // Use the guild nickname if available
                token.nickname = guildData.nick;
              } else if (discordProfile.global_name) {
                // Fallback to global display name
                token.nickname = discordProfile.global_name;
              } else {
                // Final fallback to username
                token.nickname = discordProfile.username;
              }
            } else {
              // No guild data available, set empty roles
              token.roles = [];

              // Set nickname from profile
              if (discordProfile.global_name) {
                token.nickname = discordProfile.global_name;
              } else {
                token.nickname = discordProfile.username;
              }
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

        session.user.nickname = token.nickname;

        session.user.roles = token.roles || [];

        if (session.user.id === DEVELOPER_ID) {
          session.user.isAdmin = true;
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord") {
        try {
          const { id: discordId, name, image } = user;

          const accessToken = account.access_token;

          let discordNickname = null;

          if (accessToken) {
            const guildData = await getGuildData(accessToken);

            if (guildData && guildData.nick) {
              discordNickname = guildData.nick;
            } else if (user.global_name) {
              discordNickname = user.global_name;
            } else {
              discordNickname = name;
            }
          } else {
            discordNickname = name;
          }

          const discordUsername = name;
          const discordProfilePicture = image;

          const { db } = await connectToDatabase();

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
        }
      }

      return true;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
  logger: {
    error(code, metadata) {
      // Suppress JWT decryption errors when cookies are blocked
      // This is expected behavior when users have cookies disabled
      if (code === "JWT_SESSION_ERROR") {
        const error = metadata as any;
        // Check if it's a JWT decryption failure (happens when cookies are blocked)
        if (
          error?.name === "JWEDecryptionFailed" ||
          error?.message?.includes("decryption operation failed") ||
          (error?.error && error.error.name === "JWEDecryptionFailed")
        ) {
          // Silently ignore - this happens when cookies are blocked
          // NextAuth will handle it gracefully by returning an empty session
          return;
        }
      }
      
      // Log other errors normally
      if (process.env.NODE_ENV === "development") {
        safeLog.error(`[next-auth][error][${code}]`, metadata);
      }
    },
    warn(code) {
      if (process.env.NODE_ENV === "development") {
        safeLog.warn(`[next-auth][warn][${code}]`);
      }
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === "development") {
        safeLog.log(`[next-auth][debug][${code}]`, metadata);
      }
    },
  },
};
