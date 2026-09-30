import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { getContainerStats } from "@/lib/docker/container";

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
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.containerId || project.status !== "RUNNING") {
      return NextResponse.json({
        stats: null,
        message: "Container is not active",
      });
    }

    const stats = await getContainerStats(project.containerId);
    return NextResponse.json({ stats });
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Failed to fetch container stats";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
