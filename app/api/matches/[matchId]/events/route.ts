import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, ChangeStream, ChangeStreamDocument } from "mongodb";

export async function GET(
  req: NextRequest,
  { params }: { params: { matchId: string } }
) {
  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  // Create a new stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const changeStream = db
          .collection("Matches")
          .watch([
            { $match: { "documentKey._id": new ObjectId(params.matchId) } },
          ]);

        // Send initial match data
        const match = await db
          .collection("Matches")
          .findOne({ _id: new ObjectId(params.matchId) });

        if (match) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(match)}\n\n`)
          );
        }

        // Listen for changes
        changeStream.on("change", async (change: ChangeStreamDocument) => {
          // Fetch the latest document since fullDocument might not be available
          const updatedMatch = await db
            .collection("Matches")
            .findOne({ _id: new ObjectId(params.matchId) });

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
        console.error("Stream error:", error);
        controller.close();
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
