import { NextRequest, NextResponse } from "next/server";
import { verifyKey } from "discord-interactions";
import clientPromise from "@/lib/mongodb";

// Configure for serverless environment
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Add OPTIONS handler for CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers":
        "Content-Type, x-signature-ed25519, x-signature-timestamp",
    },
  });
}

export async function POST(request: NextRequest) {
  console.log("Discord interaction received");

  // Get Discord public key from environment
  const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
  if (!PUBLIC_KEY) {
    console.error("Missing DISCORD_PUBLIC_KEY");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    // Clone request for verification
    const reqClone = request.clone();

    // Get headers needed for verification
    const signature = reqClone.headers.get("x-signature-ed25519");
    const timestamp = reqClone.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
      console.error("Missing signature headers");
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    // Get raw body for verification
    const rawBody = await reqClone.text();
    console.log("Raw body length:", rawBody.length);

    // Verify the signature
    const isValid = verifyKey(rawBody, signature, timestamp, PUBLIC_KEY);

    if (!isValid) {
      console.error("Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Parse the body
    const body = JSON.parse(rawBody);
    console.log("Interaction type:", body.type);

    // Handle PING from Discord (type 1)
    if (body.type === 1) {
      console.log("Responding to Discord PING");
      return NextResponse.json({ type: 1 });
    }

    // Handle button interactions
    if (body.type === 3) {
      const customId = body.data.custom_id;
      const userId = body.member?.user?.id || body.user?.id;

      console.log("Button interaction:", customId, "from user:", userId);

      if (!userId) {
        return NextResponse.json(
          { error: "User ID not found" },
          { status: 400 }
        );
      }

      const db = (await clientPromise).db();

      if (customId === "join_match") {
        const queue = await db.collection("Queues").findOne({
          "players.discordId": userId,
          status: "full",
        });

        if (queue) {
          await db
            .collection("Queues")
            .updateOne(
              { _id: queue._id, "players.discordId": userId },
              { $set: { "players.$.ready": true } }
            );

          return NextResponse.json({
            type: 4,
            data: {
              content: "✅ You've been marked as ready!",
              flags: 64,
            },
          });
        }
      } else if (customId === "decline_match") {
        await db
          .collection("Queues")
          .updateOne(
            { "players.discordId": userId },
            { $pull: { players: { discordId: userId } } as any }
          );

        return NextResponse.json({
          type: 4,
          data: {
            content: "You've been removed from the queue.",
            flags: 64,
          },
        });
      }

      return NextResponse.json({
        type: 4,
        data: {
          content: "Please visit the website to manage your queue status.",
          flags: 64,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported interaction type" },
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
