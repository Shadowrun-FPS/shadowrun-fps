import { AuthOptions, DefaultSession } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { DefaultJWT } from "next-auth/jwt";
import { connectToDatabase } from "@/lib/mongodb";
import { NextAuthOptions } from "next-auth";
import { getGuildData, updatePlayerGuildNickname } from "./discord-helpers";

import { SECURITY_CONFIG } from "./security-config";
import { safeLog } from "./security";
import { getDiscordDefaultAvatarUrl } from "./discord-default-avatar";

// Grant admin access to this specific user regardless of roles
const DEVELOPER_ID = SECURITY_CONFIG.DEVELOPER_ID;

// Add this type definition at the top of your file
interface DiscordProfile {
  id: string;
  username: string;
  avatar: string | null;
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
          profile.image_url = getDiscordDefaultAvatarUrl(profile.id);
        } else {
          const format = profile.avatar.startsWith("a_") ? "gif" : "png";
          profile.image_url = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.${format}`;
        }

        return {
          id: profile.id,
          name: profile.username,
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

        // Get basic Discord data (single getGuildData — signIn must not call Discord APIs)
        if (profile) {
          const discordProfile = profile as unknown as DiscordProfile;

          token.id = discordProfile.id;
          token.name = discordProfile.username;
          token.image =
            discordProfile.avatar == null
              ? getDiscordDefaultAvatarUrl(discordProfile.id)
              : `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.${
                  discordProfile.avatar.startsWith("a_") ? "gif" : "png"
                }`;

          let guildData: Awaited<ReturnType<typeof getGuildData>> = null;

          if (account.access_token) {
            guildData = await getGuildData(account.access_token);

            if (guildData) {
              token.roles = guildData.roles || [];

              if (guildData.nick) {
                token.nickname = guildData.nick;
              } else if (discordProfile.global_name) {
                token.nickname = discordProfile.global_name;
              } else {
                token.nickname = discordProfile.username;
              }
            } else {
              token.roles = [];

              if (discordProfile.global_name) {
                token.nickname = discordProfile.global_name;
              } else {
                token.nickname = discordProfile.username;
              }
            }
          }

          try {
            const { db } = await connectToDatabase();
            const now = new Date();
            await db.collection("Players").updateOne(
              { discordId: discordProfile.id },
              {
                $set: {
                  discordNickname: token.nickname as string,
                  discordUsername: discordProfile.username,
                  discordProfilePicture: token.image as string,
                  updatedAt: now,
                },
                $setOnInsert: {
                  stats: [],
                  createdAt: now,
                  joinedAt: now,
                },
              },
              { upsert: true }
            );

            if (guildData?.nick) {
              try {
                await updatePlayerGuildNickname(
                  discordProfile.id,
                  guildData.nick
                );
              } catch (teamSyncError) {
                safeLog.error(
                  "Guild nickname team sync failed after OAuth:",
                  teamSyncError
                );
              }
            }
          } catch (e) {
            safeLog.error("Players sync after Discord OAuth:", e);
          }
        }

        // Always grant admin access to developer account
        if (token.id === DEVELOPER_ID) {
          token.isAdmin = true;
        }
      }

      // Do not persist email in the JWT (not used by the app; reduces exposure in session)
      delete (token as { email?: unknown }).email;

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.name = token.name;
        session.user.image = token.image as string;

        session.user.nickname = token.nickname;

        session.user.roles = token.roles || [];

        if (session.user.id === DEVELOPER_ID) {
          session.user.isAdmin = true;
        }
      }

      delete (session.user as { email?: unknown }).email;

      return session;
    },
    async signIn() {
      // Players collection + guild nickname are updated in jwt after a single
      // getGuildData call (avoids Discord /users/@me/guilds rate limits).
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
      // Debug logs disabled - too verbose for normal development
      // Uncomment below if you need to debug auth issues:
      // if (process.env.NODE_ENV === "development") {
      //   safeLog.log(`[next-auth][debug][${code}]`, metadata);
      // }
    },
  },
};
