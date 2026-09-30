import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { getContainerLogs } from "@/lib/docker/container";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const tail = parseInt(searchParams.get("tail") || "100", 10);

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.containerId) {
      return NextResponse.json({
        logs: "No container is running for this project.",
      });
    }

    const logs = await getContainerLogs(project.containerId, tail);
    return NextResponse.json({ logs });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Failed to fetch logs";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
