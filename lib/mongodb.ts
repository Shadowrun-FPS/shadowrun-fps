import { MongoClient, type MongoClientOptions } from "mongodb";

const options: MongoClientOptions = {
  // Fail fast in local/dev when Atlas is unreachable (VPN, IP allowlist, etc.)
  serverSelectionTimeoutMS: 5000,
};

let clientPromise: Promise<MongoClient> | null = null;

function getClientPromise(): Promise<MongoClient> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Please add your MongoDB URI to .env.local");
  }

  if (clientPromise) {
    return clientPromise;
  }

  const connect = (): Promise<MongoClient> => {
    const client = new MongoClient(uri, options);
    return client.connect().catch((error) => {
      // Allow the next request to retry instead of caching a rejected promise
      clientPromise = null;
      if (process.env.NODE_ENV === "development") {
        const globalWithMongo = global as typeof globalThis & {
          _mongoClientPromise?: Promise<MongoClient>;
        };
        delete globalWithMongo._mongoClientPromise;
      }
      throw error;
    });
  };

  if (process.env.NODE_ENV === "development") {
    // In development mode, use a global variable so that the value
    // is preserved across module reloads caused by HMR (Hot Module Replacement).
    const globalWithMongo = global as typeof globalThis & {
      _mongoClientPromise?: Promise<MongoClient>;
    };

    if (!globalWithMongo._mongoClientPromise) {
      globalWithMongo._mongoClientPromise = connect();
    }
    clientPromise = globalWithMongo._mongoClientPromise;
  } else {
    clientPromise = connect();
  }

  return clientPromise;
}

export async function connectToDatabase() {
  try {
    const client = await getClientPromise();
    const db = client.db("ShadowrunWeb");
    return { client, db };
  } catch (error) {
    // Use safeLog if available, fallback to console for critical errors
    if (typeof process !== "undefined" && process.env) {
      const { safeLog } = require("./security");
      safeLog.error("Failed to connect to MongoDB:", error);
    } else {
      console.error("Failed to connect to MongoDB:", error);
    }
    throw error;
  }
}

/** Lazily connects on first await — safe to import during `next build` without env. */
const clientPromiseProxy = {
  then(
    onfulfilled?:
      | ((value: MongoClient) => MongoClient | PromiseLike<MongoClient>)
      | null,
    onrejected?: ((reason: unknown) => unknown) | null
  ) {
    return getClientPromise().then(onfulfilled, onrejected);
  },
  catch(onrejected?: ((reason: unknown) => unknown) | null) {
    return getClientPromise().catch(onrejected);
  },
  finally(onfinally?: (() => void) | null) {
    return getClientPromise().finally(onfinally);
  },
} as Promise<MongoClient>;

export default clientPromiseProxy;
