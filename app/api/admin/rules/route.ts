import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { SECURITY_CONFIG, hasAdminRole } from "@/lib/security-config";
import { isAuthorizedAdmin } from "@/lib/admin-auth";

// GET all rules
export async function GET() {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    // Connect to database
    const { db } = await connectToDatabase();

    // Fetch rules from database
    const rules = await db.collection("Rules").find({}).toArray();

    return NextResponse.json(rules);
  } catch (error) {
    console.error("Error fetching rules:", error);
    return NextResponse.json(
      { error: "Failed to fetch rules" },
      { status: 500 }
    );
  }
}

// POST a new rule
export async function POST(req: Request) {
  try {
    // Get user session
    const session = await getServerSession(authOptions);

    if (!isAuthorizedAdmin(session)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    // Validate rule data
    if (!data.title) {
      return NextResponse.json(
        { error: "Rule title is required" },
        { status: 400 }
      );
    }

    // Connect to database
    const { db } = await connectToDatabase();

    // Create rule object
    const rule = {
      title: data.title,
      description: data.description || "",
      severity: data.severity || "medium",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert rule to database
    const result = await db.collection("Rules").insertOne(rule);

    return NextResponse.json({
      ...rule,
      _id: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating rule:", error);
    return NextResponse.json(
      { error: "Failed to create rule" },
      { status: 500 }
    );
  }
}
