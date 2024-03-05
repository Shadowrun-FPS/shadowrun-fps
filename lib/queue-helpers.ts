import { Queue } from "@/types/types";
import clientPromise from "./mongodb";

export async function getQueues(teamSize: number, gameType: string) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");
  const queues = await db
    .collection("Queues")
    .find({ teamSize, gameType })
    .toArray();
  return queues as unknown as Queue[];
}
