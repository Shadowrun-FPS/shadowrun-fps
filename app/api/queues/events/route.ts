import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

// Track the last update timestamp
let lastUpdateTimestamp = Date.now();
let cachedQueues = null;

export async function GET(req: NextRequest) {
  const headers = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const { db } = await connectToDatabase();

      // Send initial data
      const queues = await db.collection("Queues").find({}).toArray();
      cachedQueues = queues;

      controller.enqueue(encoder.encode(`data: ${JSON.stringify(queues)}\n\n`));

      // Set up a change stream to listen for queue updates
      const changeStream = db.collection("Queues").watch();

      changeStream.on("change", async () => {
        const updatedQueues = await db.collection("Queues").find({}).toArray();
        cachedQueues = updatedQueues;
        lastUpdateTimestamp = Date.now();

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(updatedQueues)}\n\n`)
        );
      });

      // Keep connection alive
      const keepAliveInterval = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 30000);

      req.signal.addEventListener("abort", () => {
        clearInterval(keepAliveInterval);
        changeStream.close();
      });
    },
  });

  return new Response(stream, { headers });
}
