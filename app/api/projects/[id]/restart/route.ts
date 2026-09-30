import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { restartContainer } from "@/lib/docker/container";
import { logAuditEvent } from "@/lib/audit";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.containerId) {
      return NextResponse.json(
        { error: "No container found for this project" },
        { status: 400 }
      );
    }

    await restartContainer(project.containerId);

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: { status: "RUNNING" },
    });

    await logAuditEvent({
      userId: session.userId,
      action: "CONTAINER_RESTARTED",
      resource: "PROJECT",
      resourceId: projectId,
    });

    return NextResponse.json({ success: true, project: updated });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Failed to restart container";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
