import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { updateProjectSchema } from "@/lib/projects/validation";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        domains: {
          orderBy: { createdAt: "asc" },
        },
        environmentVariables: {
          select: {
            id: true,
            key: true,
            isSecret: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: { key: "asc" },
        },
        deployments: {
          take: 20,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error("[API /projects/[id] GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const result = updateProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const updated = await prisma.project.update({
      where: { id },
      data: result.data,
    });

    await logAuditEvent({
      userId: session.userId,
      action: "PROJECT_UPDATED",
      resource: "PROJECT",
      resourceId: updated.id,
      metadata: result.data,
    });

    return NextResponse.json({ project: updated });
  } catch (error) {
    console.error("[API /projects/[id] PATCH] Error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Cascade delete project (Prisma schema cascades deployments, domains, env vars)
    await prisma.project.delete({
      where: { id },
    });

    await logAuditEvent({
      userId: session.userId,
      action: "PROJECT_DELETED",
      resource: "PROJECT",
      resourceId: id,
      metadata: { name: project.name, slug: project.slug },
    });

    return NextResponse.json({
      success: true,
      message: `Project '${project.name}' deleted successfully`,
    });
  } catch (error) {
    console.error("[API /projects/[id] DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
