import { NextRequest, NextResponse } from "next/server";

type TimerMap = {
  [matchId: string]: number;
};

const activeTimers: TimerMap = {};

export async function GET(request: NextRequest) {
  // GET the current time remaining for a match ready check
  try {
    const searchParams = request.nextUrl.searchParams;
    const matchId = searchParams.get("matchId") as string;
    const timeRemaining = activeTimers[matchId];
    return NextResponse.json({
      ok: true,
      timeRemaining,
      status: 200,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      message: "Error getting match ready check time: " + e,
      status: 500,
    });
  }
}

export async function POST(request: NextRequest) {
  // POST to start a new match ready check
  console.log("Starting match ready check");
  try {
    const body = await request.json();
    const matchId = body.matchId;
    const defaultTime = 300;
    activeTimers[matchId] = defaultTime;
    // Call a function to begin decrementing the timer
    decrementTimer(matchId);
    return NextResponse.json({
      ok: true,
      message: "Match ready check started",
      status: 201,
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      message: "Error starting match ready check: " + e,
      status: 500,
    });
  }
}
function decrementTimer(matchId: string) {
  // Decrement the timer for a match ready check
  const timer = setInterval(() => {
    activeTimers[matchId] -= 1;
    if (activeTimers[matchId] <= 0) {
      clearInterval(timer);
    }
  }, 1000);
}
