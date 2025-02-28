import { Db, MongoClient } from "mongodb";
import clientPromise from "./client";

let cachedDb: Db | null = null;

export async function getDb() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  cachedDb = db;
  return db;
}

export async function withDb<T>(operation: (db: Db) => Promise<T>): Promise<T> {
  const db = await getDb();
  return operation(db);
}
