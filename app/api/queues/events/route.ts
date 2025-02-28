import { NextRequest } from "next/server";
import { headers } from "next/headers";
import clientPromise from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  const headersList = headers();
  const encoder = new TextEncoder();
  let changeStream: any = null;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const client = await clientPromise;
        const db = client.db("ShadowrunWeb");

        // Send initial queues data
        const queues = await db
          .collection("Queues")
          .find({ status: "active" })
          .toArray();

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(queues)}\n\n`)
        );

        // Set up change stream for Queues collection
        changeStream = db.collection("Queues").watch();

        // Listen for changes
        changeStream.on("change", async () => {
          if (controller.desiredSize === null) return; // Check if controller is still active

          const updatedQueues = await db
            .collection("Queues")
            .find({ status: "active" })
            .toArray();

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(updatedQueues)}\n\n`)
          );
        });
      } catch (error) {
        console.error("SSE Error:", error);
        controller.close();
      }
    },
    cancel() {
      // Clean up when the stream is cancelled
      if (changeStream) {
        changeStream.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
