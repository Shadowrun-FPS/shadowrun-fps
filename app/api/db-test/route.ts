import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const { db } = await connectToDatabase();

    // Basic connection info
    const dbName = db.databaseName;
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    return NextResponse.json({
      success: true,
      connection: {
        dbName,
        collections: collectionNames,
      },
    });
  } catch (error) {
    console.error("Database connection error:", error);
    return NextResponse.json(
      {
        error: String(error),
        stack: (error as Error).stack,
      },
      { status: 500 }
    );
  }
}
