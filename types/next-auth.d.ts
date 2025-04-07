// next-auth.d.ts
import "next-auth";
import { JWT } from "next-auth/jwt";
import NextAuth from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session.user object
   * with custom properties.
   */
  interface User {
    id: string;
    name?: string | null;
    image?: string | null;
    nickname?: string | null;
    global_name?: string | null;
  }

  /** Extends the session object to include the custom user type */
  interface Session {
    user: {
      id: string;
      name?: string | null;
      nickname?: string | null;
      image?: string | null;
      global_name?: string | null;
      isAdmin?: boolean;
      roles?: string[];
      accessToken?: string;
    };
    accessToken?: string;
    expires: string;
  }
}

declare module "next-auth/jwt" {
  /** Extends the built-in token model to include custom properties */
  interface JWT {
    id?: string;
    accessToken?: string;
    nickname?: string;
    global_name?: string;
  }
}
