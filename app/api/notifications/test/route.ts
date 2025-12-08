import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Debug info
    const dbName = db.databaseName;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    // Try with the exact collection name we see in the database
    const allNotifications = await db
      .collection("Notifications")
      .find({})
      .limit(10)
      .toArray();

    return NextResponse.json({
      dbInfo: {
        dbName,
        collections: collectionNames,
      },
      totalCount: allNotifications.length,
      notifications: allNotifications,
    });
  } catch (error) {
    const { safeLog } = await import("@/lib/security");
    safeLog.error("Error in test endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
