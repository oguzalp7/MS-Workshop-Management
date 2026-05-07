import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData, defaultSession } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    const session = await getIronSession<SessionData>(request, response, sessionOptions);
    
    // Destroy session
    session.adminId = defaultSession.adminId;
    session.username = defaultSession.username;
    session.name = defaultSession.name;
    session.isLoggedIn = defaultSession.isLoggedIn;
    await session.save();

    return response;
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
