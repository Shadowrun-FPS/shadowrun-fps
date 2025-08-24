import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG } from "@/lib/security-config";

// PUT (update) a rule
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check if user has required roles
    const isAuthorized =
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      (session?.user?.roles &&
        (session?.user?.roles.includes("admin") ||
          session?.user?.roles.includes("founder")));

    if (!session?.user || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Connect to database
    const { db } = await connectToDatabase();

    // Update rule
    const result = await db.collection("Rules").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          title: data.title,
          description: data.description,
          severity: data.severity,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating rule:", error);
    return NextResponse.json(
      { error: "Failed to update rule" },
      { status: 500 }
    );
  }
}

// DELETE a rule
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Check if user has required roles
    const isAuthorized =
      session?.user?.id === SECURITY_CONFIG.DEVELOPER_ID ||
      (session?.user?.roles &&
        (session?.user?.roles.includes("admin") ||
          session?.user?.roles.includes("founder")));

    if (!session?.user || !isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Delete rule
    const result = await db
      .collection("Rules")
      .deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Rule not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting rule:", error);
    return NextResponse.json(
      { error: "Failed to delete rule" },
      { status: 500 }
    );
  }
}
