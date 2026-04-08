import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { enrichQueueDocumentsWithRoleNames } from "@/lib/enrich-queue-documents-role-names";
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
          } catch {
            // Change stream might already be closed
          }
        };

        const safeEnqueue = (payload: string) => {
          if (isClosed) return;
          try {
            controller.enqueue(payload);
          } catch (err) {
            const message = err instanceof Error ? err.message : String(err);
            if (
              message.includes("closed") ||
              (err as { code?: string })?.code === "ERR_INVALID_STATE"
            ) {
              cleanup();
            } else {
              safeLog.error("SSE enqueue error:", err);
            }
          }
        };

        try {
          // Send initial queues data (client may disconnect during await)
          const initialQueues = await db.collection("Queues").find({}).toArray();
          if (isClosed || req.signal.aborted) {
            cleanup();
            try {
              controller.close();
            } catch {
              /* already closed */
            }
            return;
          }
          const enrichedInitial = await enrichQueueDocumentsWithRoleNames(
            initialQueues,
            db
          );
          safeEnqueue(`data: ${JSON.stringify(enrichedInitial)}\n\n`);

          // Watch for queue changes
          changeStream.on("change", async () => {
            if (isClosed) return;

            try {
              const updatedQueues = await db
                .collection("Queues")
                .find({})
                .toArray();
              const enriched = await enrichQueueDocumentsWithRoleNames(
                updatedQueues,
                db
              );
              safeEnqueue(`data: ${JSON.stringify(enriched)}\n\n`);
            } catch (error) {
              safeLog.error("Error sending queue update:", error);
            }
          });

          changeStream.on("error", (error) => {
            safeLog.error("Change stream error:", error);
            safeEnqueue(
              `data: ${JSON.stringify({ type: "error", message: "Change stream error" })}\n\n`
            );
          });

          heartbeatInterval = setInterval(() => {
            if (isClosed) {
              if (heartbeatInterval) {
                clearInterval(heartbeatInterval);
                heartbeatInterval = null;
              }
              return;
            }

            safeEnqueue(
              `data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`
            );
          }, 15000);

          req.signal.addEventListener("abort", () => {
            cleanup();
            try {
              controller.close();
            } catch {
              /* already closed */
            }
          });
        } catch (error) {
          safeLog.error("Error in SSE stream start:", error);
          cleanup();
          try {
            controller.close();
          } catch {
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
