import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json({
      message: "Session information",
      user: {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        roles: session.user.roles,
        isAdmin: session.user.isAdmin,
      },
      idCheck: {
        exactMatch: session.user.id === "238329746671271936",
        stringMatch: session.user.id.toString() === "238329746671271936",
        idType: typeof session.user.id,
      },
    });
  } catch (error) {
    console.error("Error in test session:", error);
    return NextResponse.json(
      { error: "Failed to get session information" },
      { status: 500 }
    );
  }
}
