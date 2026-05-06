import { NextRequest, NextResponse } from "next/server";
import { verifyKey } from "discord-interactions";
import { safeLog, sanitizeString } from "@/lib/security";

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
  safeLog.log("Discord interaction received");

  const PUBLIC_KEY = process.env.DISCORD_PUBLIC_KEY;
  if (!PUBLIC_KEY) {
    safeLog.error("Missing DISCORD_PUBLIC_KEY");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const reqClone = request.clone();

    const signature = reqClone.headers.get("x-signature-ed25519");
    const timestamp = reqClone.headers.get("x-signature-timestamp");

    if (!signature || !timestamp) {
      safeLog.error("Missing signature headers");
      return NextResponse.json(
        { error: "Missing signature headers" },
        { status: 401 }
      );
    }

    const rawBody = await reqClone.text();

    const isValid = verifyKey(rawBody, signature, timestamp, PUBLIC_KEY);

    if (!isValid) {
      safeLog.error("Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body = JSON.parse(rawBody);
    safeLog.log("Interaction type received", { type: body.type });

    if (body.type === 1) {
      return NextResponse.json({ type: 1 });
    }

    if (body.type === 3) {
      const customId = sanitizeString(body.data?.custom_id || "", 100);
      safeLog.log("Message component interaction", { customId });

      return NextResponse.json({
        type: 4,
        data: {
          content:
            "That action is no longer available. Please use the website for matchmaking and updates.",
          flags: 64,
        },
      });
    }

    return NextResponse.json(
      { error: "Unsupported interaction type" },
      { status: 400 }
    );
  } catch (error) {
    safeLog.error("Error processing Discord interaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
