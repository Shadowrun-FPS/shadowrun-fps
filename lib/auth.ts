import { AuthOptions, DefaultSession } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import type { DefaultJWT } from "next-auth/jwt";

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
  type DiscordGuildData = {
    nick?: string | null;
    user?: {
      id: string;
      username: string;
      global_name?: string | null;
      avatar?: string | null;
    } | null;
  } | null;

  interface JWT extends DefaultJWT {
    sub?: string;
    accessToken?: string;
    roles?: string[];
    guild: DiscordGuildData;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub as string; // Ensure Discord ID is always in session
        session.user.accessToken = token.accessToken as string;
        session.user.roles = (token.roles as string[]) || [];

        // Ensure your ID always has admin access regardless of token roles
        if (session.user.id === "238329746671271936") {
          if (!session.user.roles) {
            session.user.roles = [];
          }
          if (!session.user.roles.includes("admin")) {
            session.user.roles.push("admin");
          }
          if (!session.user.roles.includes("moderator")) {
            session.user.roles.push("moderator");
          }
          // Add founder role as well for completeness
          if (!session.user.roles.includes("founder")) {
            session.user.roles.push("founder");
          }

          // Add a direct isAdmin flag for simpler checks
          session.user.isAdmin = true;
        }

        // Log session creation/update
        console.log("Session callback:", {
          userId: session.user.id,
          timestamp: new Date().toISOString(),
        });
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.id = user?.id;

        // Assign roles based on Discord ID
        token.roles = [];

        if (ADMIN_IDS.includes(user?.id as string)) {
          token.roles.push("admin");
        }

        if (MODERATOR_IDS.includes(user?.id as string)) {
          token.roles.push("moderator");
        }

        // Add other role assignments as needed

        // Log token creation
        console.log("JWT callback:", {
          userId: user?.id,
          timestamp: new Date().toISOString(),
        });
      }
      return token;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
