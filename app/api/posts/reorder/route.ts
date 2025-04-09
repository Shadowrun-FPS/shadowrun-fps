import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Helper function to check if user is admin
async function isUserAdmin(userId: string) {
  // Developer ID always has access
  if (userId === process.env.MY_DISCORD_USER_ID) return true;

  const client = await clientPromise;
  const db = client.db("ShadowrunWeb");

  // Check if user has admin roles in the database
  const user = await db.collection("Players").findOne({ discordId: userId });
  if (!user) return false;

  // Check for admin roles
  return (
    user.roles?.some(
      (role: string) =>
        role === "932585751332421642" || // Admin
        role === "1095126043918082109" // Founder
    ) || false
  );
}

// POST reorder posts
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await isUserAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json(
        { error: "Only admins can reorder posts" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const { postId, newIndex } = await req.json();

    if (!postId || typeof newIndex !== "number") {
      return NextResponse.json(
        { error: "Post ID and new index are required" },
        { status: 400 }
      );
    }

    // Get all posts sorted by order
    const posts = await db
      .collection("Posts")
      .find({})
      .sort({ order: 1 })
      .toArray();

    // Find the post to move
    const currentIndex = posts.findIndex(
      (post) => post._id.toString() === postId
    );
    if (currentIndex === -1) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Reorder the posts
    const [movedPost] = posts.splice(currentIndex, 1);
    posts.splice(newIndex, 0, movedPost);

    // Update all post orders
    const bulkOps = posts.map((post, index) => ({
      updateOne: {
        filter: { _id: post._id },
        update: { $set: { order: index } },
      },
    }));

    await db.collection("Posts").bulkWrite(bulkOps);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering posts:", error);
    return NextResponse.json(
      { error: "Failed to reorder posts" },
      { status: 500 }
    );
  }
}
