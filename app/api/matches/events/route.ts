import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { ChangeStream, Document } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

export const dynamic = "force-dynamic";

async function getMatchesEventsHandler(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const changeStream = db
    .collection("Matches")
    .watch() as ChangeStream<Document>;

    const stream = new ReadableStream({
      async start(controller) {
        // Send initial heartbeat
        controller.enqueue(
          `data: ${JSON.stringify({ type: "heartbeat" })}\n\n`
        );

        // Watch for match changes
        changeStream.on("change", async (change) => {
          try {
            if (
              change.operationType === "update" ||
              change.operationType === "replace"
            ) {
              const updatedMatch = await db
                .collection("Matches")
                .findOne({ _id: change.documentKey?._id });

              if (updatedMatch) {
                controller.enqueue(`data: ${JSON.stringify(updatedMatch)}\n\n`);
              }
            }
          } catch (error) {
            safeLog.error("Error processing change:", error);
          }
        });

        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(
              `data: ${JSON.stringify({ type: "heartbeat" })}\n\n`
            );
          } catch (error) {
            safeLog.error("Error sending heartbeat:", error);
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

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}

export const GET = withApiSecurity(getMatchesEventsHandler, {
  rateLimiter: "api",
  requireAuth: true,
});
