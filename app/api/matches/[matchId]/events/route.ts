import { NextRequest, NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, ChangeStream, ChangeStreamDocument } from "mongodb";
import { safeLog, sanitizeString } from "@/lib/security";
import { withApiSecurity } from "@/lib/api-wrapper";

async function getMatchEventsHandler(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const matchId = sanitizeString(params.matchId, 100);
  if (!ObjectId.isValid(matchId)) {
    return NextResponse.json({ error: "Invalid match ID" }, { status: 400 });
  }

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const changeStream = db
          .collection("Matches")
          .watch([
            { $match: { "documentKey._id": new ObjectId(matchId) } },
          ]);

        const match = await db
          .collection("Matches")
          .findOne({ _id: new ObjectId(matchId) });

        if (match) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(match)}\n\n`)
          );
        }

        changeStream.on("change", async (change: ChangeStreamDocument) => {
          const updatedMatch = await db
            .collection("Matches")
            .findOne({ _id: new ObjectId(matchId) });

          if (updatedMatch) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(updatedMatch)}\n\n`)
            );
          }
        });

        // Handle client disconnect
        req.signal.addEventListener("abort", () => {
          changeStream.close();
          controller.close();
        });
      } catch (error) {
        safeLog.error("Stream error:", error);
        controller.close();
      }
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

export const GET = withApiSecurity(getMatchEventsHandler, {
  rateLimiter: "api",
  requireAuth: false,
});
