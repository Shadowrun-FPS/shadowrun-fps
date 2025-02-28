// next-auth.d.ts
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Extends the built-in session.user object
   * with custom properties.
   */
  interface User {
    /** Example of a custom user property */
    guild: any;
    global_name: string;
    nickname?: string;
    id: string;
  }

  /** Extends the session object to include the custom user type */
  interface Session {
    user: User & {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      nickname?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Extends the built-in token model to include custom properties */
  interface JWT {
    guild: any;
  }
}
