import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Check if initial admin setup is needed (no users in database)
    const userCount = await prisma.user.count();
    const needsSetup = userCount === 0;

    const session = await getCurrentSession();

    if (!session) {
      return NextResponse.json({
        user: null,
        needsSetup,
      });
    }

    // Verify user still exists in database and get fresh info
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({
        user: null,
        needsSetup,
      });
    }

    return NextResponse.json({
      user,
      needsSetup: false,
    });
  } catch (error) {
    console.error("[Auth /me] Error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve authentication status" },
      { status: 500 }
    );
  }
}
