import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { ObjectId, Document, UpdateFilter } from "mongodb";

interface TeamMember {
  discordId: string;
  discordNickname: string;
  role: string;
  joinedAt: Date;
}

interface Team {
  _id: ObjectId;
  members: TeamMember[];
}

export async function POST(
  request: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action } = await request.json();
    const client = await clientPromise;
    const db = client.db("ShadowrunWeb");

    // Get the notification
    const notification = await db
      .collection("Notifications")
      .findOne({ _id: new ObjectId(params.notificationId) });

    if (!notification) {
      return NextResponse.json(
        { error: "Notification not found" },
        { status: 404 }
      );
    }

    if (notification.recipientId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // If accepting a team invite, check existing team membership
    if (notification.type === "TEAM_INVITE" && action === "accept") {
      // Check if user is already in a team
      const existingTeam = await db.collection("Teams").findOne({
        "members.discordId": session.user.id,
      });

      if (existingTeam) {
        return NextResponse.json(
          {
            error: "Cannot join team",
            message:
              "You must leave your current team before joining another team.",
          },
          { status: 400 }
        );
      }

      // Check if the team still exists
      const team = await db
        .collection("Teams")
        .findOne({ _id: new ObjectId(notification.teamId) });

      if (!team) {
        return NextResponse.json(
          { error: "Team no longer exists" },
          { status: 404 }
        );
      }

      // Check if team is full (4 main players + 1 substitute)
      if (team.members.length >= 5) {
        return NextResponse.json({ error: "Team is full" }, { status: 400 });
      }
    }

    // Update notification status
    await db
      .collection("Notifications")
      .updateOne(
        { _id: new ObjectId(params.notificationId) },
        { $set: { status: action === "accept" ? "ACCEPTED" : "DECLINED" } }
      );

    // If it's a team invite and was accepted, add user to team
    if (notification.type === "TEAM_INVITE" && action === "accept") {
      const newMember: TeamMember = {
        discordId: session.user.id,
        discordNickname: session.user.name || "",
        role: "member",
        joinedAt: new Date(),
      };

      await db
        .collection<Team>("Teams")
        .updateOne({ _id: new ObjectId(notification.teamId) }, {
          $push: { members: newMember },
        } as UpdateFilter<Team>);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to respond to notification:", error);
    return NextResponse.json(
      { error: "Failed to respond to notification" },
      { status: 500 }
    );
  }
}
