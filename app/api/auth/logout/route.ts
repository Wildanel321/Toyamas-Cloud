import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentSession } from "@/lib/auth/session";
import { logAuditEvent } from "@/lib/audit";

export async function POST() {
  try {
    const session = await getCurrentSession();
    if (session) {
      await logAuditEvent({
        userId: session.userId,
        action: "LOGOUT",
        resource: "USER",
        resourceId: session.userId,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully",
    });

    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error("[Auth /logout] Error:", error);
    const response = NextResponse.json(
      { error: "Logout encountered an issue, session cleared" },
      { status: 200 }
    );
    clearSessionCookie(response);
    return response;
  }
}
