import clientPromise from "@/lib/mongodb";

// Create a simple adapter interface
interface Adapter {
  createUser: (user: any) => Promise<any>;
  getUser: (id: string) => Promise<any>;
  getUserByEmail: (email: string) => Promise<any>;
  getUserByAccount: (providerAccountId: any) => Promise<any>;
  updateUser: (user: any) => Promise<any>;
  linkAccount: (account: any) => Promise<any>;
  createSession: (session: any) => Promise<any>;
  getSessionAndUser: (sessionToken: string) => Promise<any>;
  updateSession: (session: any) => Promise<any>;
  deleteSession: (sessionToken: string) => Promise<void>;
}

// Stub implementation of the MongoDB adapter
export function MongoDBAdapter(client: Promise<any>): Adapter {
  return {
    async createUser(user) {
      console.warn("Using stub adapter - createUser");
      return user;
    },
    async getUser(id) {
      console.warn("Using stub adapter - getUser");
      return null;
    },
    async getUserByEmail(email) {
      console.warn("Using stub adapter - getUserByEmail");
      return null;
    },
    async getUserByAccount(providerAccountId) {
      console.warn("Using stub adapter - getUserByAccount");
      return null;
    },
    async updateUser(user) {
      console.warn("Using stub adapter - updateUser");
      return user;
    },
    async linkAccount(account) {
      console.warn("Using stub adapter - linkAccount");
      return account;
    },
    async createSession(session) {
      console.warn("Using stub adapter - createSession");
      return session;
    },
    async getSessionAndUser(sessionToken) {
      console.warn("Using stub adapter - getSessionAndUser");
      return { session: null, user: null };
    },
    async updateSession(session) {
      console.warn("Using stub adapter - updateSession");
      return session;
    },
    async deleteSession(sessionToken) {
      console.warn("Using stub adapter - deleteSession");
    },
  };
}

// Export the adapter instance for use in the app
export const mongoAdapter = MongoDBAdapter(clientPromise);
