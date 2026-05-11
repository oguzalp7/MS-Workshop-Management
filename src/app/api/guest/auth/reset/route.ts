import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    
    // Clear both workshop_session_token and the iron-session cookie
    cookieStore.delete("workshop_session_token");
    cookieStore.delete("workshop_guest_session"); // Assuming this is the iron-session cookie name

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
