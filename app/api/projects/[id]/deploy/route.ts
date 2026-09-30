import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { queueDeployment } from "@/lib/queue/deployment-queue";
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

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        projectId,
        status: "QUEUED",
        trigger: "MANUAL",
        buildLog: "[System] Deployment queued. Initializing builder...\n",
      },
    });

    // Enqueue job for background execution
    await queueDeployment({
      deploymentId: deployment.id,
      projectId: project.id,
      createdAt: new Date().toISOString(),
    });

    await logAuditEvent({
      userId: session.userId,
      action: "DEPLOYMENT_TRIGGERED",
      resource: "PROJECT",
      resourceId: projectId,
      metadata: { deploymentId: deployment.id },
    });

    return NextResponse.json({ success: true, deployment }, { status: 201 });
  } catch (error: unknown) {
    console.error("[API /projects/[id]/deploy POST] Error:", error);
    const errMsg = error instanceof Error ? error.message : "Failed to queue deployment";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
