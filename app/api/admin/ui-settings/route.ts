import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Verify admin access
    if (!session?.user?.roles?.includes("admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { component, settings } = await req.json();

    const client = await clientPromise;
    const db = client.db();

    // Update UI settings
    await db
      .collection("ui_settings")
      .updateOne({ component }, { $set: { settings } }, { upsert: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating UI settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const component = searchParams.get("component");

    if (!component) {
      return NextResponse.json(
        { error: "Component parameter required" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db();

    const settings = await db.collection("ui_settings").findOne({ component });

    return NextResponse.json(settings?.settings || {});
  } catch (error) {
    console.error("Error fetching UI settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}
