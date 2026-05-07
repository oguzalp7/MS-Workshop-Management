import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    if (!session.isLoggedIn) {
      return NextResponse.json({ isLoggedIn: false }, { status: 401 });
    }

    return NextResponse.json({
      isLoggedIn: true,
      user: {
        id: session.adminId,
        username: session.username,
        name: session.name,
      },
    });
  } catch (error) {
    console.error("Session check error:", error);
    return NextResponse.json({ isLoggedIn: false }, { status: 500 });
  }
}
