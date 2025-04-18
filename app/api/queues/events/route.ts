import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Create change stream for Queues collection
    const changeStream = db.collection("Queues").watch();

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial queues data
        const initialQueues = await db.collection("Queues").find({}).toArray();
        controller.enqueue(`data: ${JSON.stringify(initialQueues)}\n\n`);

        // Watch for queue changes
        changeStream.on("change", async () => {
          try {
            // Fetch updated queues
            const updatedQueues = await db
              .collection("Queues")
              .find({})
              .toArray();
            controller.enqueue(`data: ${JSON.stringify(updatedQueues)}\n\n`);
          } catch (error) {
            console.error("Error sending queue update:", error);
          }
        });

        // Send heartbeat every 30 seconds
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(
              `data: ${JSON.stringify({ type: "heartbeat" })}\n\n`
            );
          } catch (error) {
            console.error("Error sending heartbeat:", error);
            clearInterval(heartbeat);
          }
        }, 30000);

        // Clean up on stream end
        req.signal.addEventListener("abort", () => {
          clearInterval(heartbeat);
          changeStream.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("SSE connection error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
