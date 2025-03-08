import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import clientPromise from "@/lib/mongodb";
import { authOptions } from "@/lib/auth";
import { ChangeStream, Document } from "mongodb";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Create change stream for Matches collection
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
            console.error("Error processing change:", error);
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
