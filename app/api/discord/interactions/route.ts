import { NextRequest, NextResponse } from "next/server";
import { verifyKey } from "discord-interactions";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// New Next.js App Router configuration (replaces the deprecated config object)
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Improved verification function
async function verifyDiscordRequest(request: Request) {
  try {
    const signature = request.headers.get("x-signature-ed25519");
    const timestamp = request.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
      console.error("Missing signature or timestamp headers");
      return false;
    }

    // Get raw body as text
    const rawBody = await request.text();

    const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
    if (!PUBLIC_KEY) {
      console.error("Missing DISCORD_PUBLIC_KEY in environment variables");
      return false;
    }

    // Verify the signature
    return verifyKey(rawBody, signature, timestamp, PUBLIC_KEY);
  } catch (error) {
    console.error("Error verifying Discord request:", error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    // Clone the request so we can read the body twice
    const reqForVerification = request.clone();

    // Verify the request
    const isValid = await verifyDiscordRequest(reqForVerification);

    if (!isValid) {
      console.error("Invalid Discord request signature");
      return NextResponse.json(
        { error: "Invalid request signature" },
        { status: 401 }
      );
    }

    // Parse the request body as JSON
    const bodyText = await request.text();
    const body = JSON.parse(bodyText);

    // Handle PING from Discord (type 1)
    if (body.type === 1) {
      console.log("Responding to Discord PING");
      return NextResponse.json({ type: 1 }); // PONG response
    }

    // Handle button interactions
    if (body.type === 3) {
      // INTERACTION_TYPE_MESSAGE_COMPONENT
      const customId = body.data.custom_id;
      const userId = body.member?.user?.id || body.user?.id;

      if (!userId) {
        return NextResponse.json(
          { error: "User ID not found" },
          { status: 400 }
        );
      }

      try {
        const db = (await clientPromise).db();

        if (customId === "join_match") {
          // User clicked "Join Match" - could redirect to your site or mark as ready
          // Find queue this user is in
          const queue = await db.collection("Queues").findOne({
            "players.discordId": userId,
            status: "full",
          });

          if (queue) {
            // Mark player as ready
            await db
              .collection("Queues")
              .updateOne(
                { _id: queue._id, "players.discordId": userId },
                { $set: { "players.$.ready": true } }
              );

            return NextResponse.json({
              type: 4, // INTERACTION_CALLBACK_CHANNEL_MESSAGE_WITH_SOURCE
              data: {
                content:
                  "✅ You've been marked as ready! Please head to the Shadowrun FPS site to join the match.",
                flags: 64, // EPHEMERAL - only visible to the user
              },
            });
          }
        } else if (customId === "decline_match") {
          // User clicked "Decline" - remove them from queue
          const result = await db
            .collection("Queues")
            .updateOne(
              { "players.discordId": userId },
              { $pull: { players: { discordId: userId } } as any }
            );

          if (result.modifiedCount > 0) {
            return NextResponse.json({
              type: 4,
              data: {
                content: "You've been removed from the queue.",
                flags: 64,
              },
            });
          }
        }

        // Default response if no specific action taken
        return NextResponse.json({
          type: 4,
          data: {
            content:
              "Unable to process your request. Please visit the website directly.",
            flags: 64,
          },
        });
      } catch (error) {
        console.error("Error handling Discord interaction:", error);
        return NextResponse.json({
          type: 4,
          data: {
            content: "An error occurred processing your request.",
            flags: 64,
          },
        });
      }
    }

    // Default response for unhandled interaction types
    return NextResponse.json(
      { error: "Unhandled interaction type" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing Discord interaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
