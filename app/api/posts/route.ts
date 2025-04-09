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

// GET all posts
export async function GET(req: NextRequest) {
  try {
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get all posts, sorted by order field or date if order doesn't exist
    const posts = await db
      .collection("Posts")
      .find({})
      .sort({ order: 1, date: -1 })
      .toArray();

    return NextResponse.json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// POST new post
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
        { error: "Only admins can create posts" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const { title, description, type, imageUrl, link, authorId, author } =
      await req.json();

    // Get the highest order value
    const highestOrder = await db
      .collection("Posts")
      .find({})
      .sort({ order: -1 })
      .limit(1)
      .toArray();

    const newOrder =
      highestOrder.length > 0 ? (highestOrder[0].order || 0) + 1 : 0;

    // Create the post with the author's nickname
    const post = {
      title,
      description,
      type,
      imageUrl,
      link,
      authorId,
      author, // This will now be the Discord nickname
      datePublished: new Date().toISOString(),
      published: true,
    };

    // Create the post
    const result = await db.collection("Posts").insertOne(post);

    return NextResponse.json({
      success: true,
      postId: result.insertedId,
    });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
}

// PUT update post
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const admin = await isUserAdmin(session.user.id);
    if (!admin) {
      return NextResponse.json(
        { error: "Only admins can update posts" },
        { status: 403 }
      );
    }

    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    const data = await req.json();
    const { _id, ...updateData } = data;

    if (!_id) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    // Update the post
    await db.collection("Posts").updateOne(
      { _id: new ObjectId(_id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}
