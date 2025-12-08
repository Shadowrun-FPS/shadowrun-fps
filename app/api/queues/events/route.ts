import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getQueuesEventsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Create change stream for Queues collection
    const changeStream = db.collection("Queues").watch();

    const stream = new ReadableStream({
      async start(controller) {
        let heartbeatInterval: NodeJS.Timeout | null = null;
        let isClosed = false;

        const cleanup = () => {
          if (isClosed) return;
          isClosed = true;
          
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          
          try {
            changeStream.close();
          } catch (error) {
            // Change stream might already be closed
          }
        };

        try {
          // Send initial queues data
          const initialQueues = await db.collection("Queues").find({}).toArray();
          controller.enqueue(`data: ${JSON.stringify(initialQueues)}\n\n`);

          // Watch for queue changes
          changeStream.on("change", async () => {
            if (isClosed) return;
            
            try {
              // Fetch updated queues
              const updatedQueues = await db
                .collection("Queues")
                .find({})
                .toArray();
              controller.enqueue(`data: ${JSON.stringify(updatedQueues)}\n\n`);
            } catch (error) {
              safeLog.error("Error sending queue update:", error);
            }
          });

          changeStream.on("error", (error) => {
            safeLog.error("Change stream error:", error);
            // Try to send error notification to client
            try {
              controller.enqueue(
                `data: ${JSON.stringify({ type: "error", message: "Change stream error" })}\n\n`
              );
            } catch (e) {
              // Controller might be closed
            }
          });

          // Send heartbeat every 15 seconds (reduced from 30s for better stability)
          heartbeatInterval = setInterval(() => {
            if (isClosed) {
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }
              return;
            }
            
            try {
              controller.enqueue(
                `data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`
              );
            } catch (error) {
              // Controller closed, cleanup
              cleanup();
            }
          }, 15000);

          // Clean up on stream end
          req.signal.addEventListener("abort", () => {
            cleanup();
          });
        } catch (error) {
          safeLog.error("Error in SSE stream start:", error);
          cleanup();
          try {
            controller.close();
          } catch (e) {
            // Already closed
          }
        }
      },
    });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export const GET = withApiSecurity(getQueuesEventsHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
