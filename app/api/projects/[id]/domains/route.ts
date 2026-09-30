import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { domainSchema } from "@/lib/projects/validation";
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

    const { id: projectId } = await params;
    const domains = await prisma.domain.findMany({
      where: { projectId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ domains });
  } catch (error) {
    console.error("[API /projects/[id]/domains GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 });
  }
}

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
    const body = await request.json();
    const result = domainSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const hostname = result.data.hostname.toLowerCase().trim();

    // Check if domain is already registered to any project
    const existing = await prisma.domain.findUnique({
      where: { hostname },
      include: { project: { select: { name: true } } },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Domain '${hostname}' is already linked to project '${existing.project.name}'` },
        { status: 409 }
      );
    }

    const domain = await prisma.domain.create({
      data: {
        projectId,
        hostname,
        status: "ACTIVE",
        sslStatus: "PENDING",
      },
    });

    await logAuditEvent({
      userId: session.userId,
      action: "DOMAIN_ATTACHED",
      resource: "PROJECT",
      resourceId: projectId,
      metadata: { hostname },
    });

    return NextResponse.json({ domain }, { status: 201 });
  } catch (error) {
    console.error("[API /projects/[id]/domains POST] Error:", error);
    return NextResponse.json({ error: "Failed to attach domain" }, { status: 500 });
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

    const { id: projectId } = await params;
    const { searchParams } = new URL(request.url);
    const domainId = searchParams.get("domainId");

    if (!domainId) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
    }

    const domain = await prisma.domain.findUnique({
      where: { id: domainId, projectId },
    });

    if (!domain) {
      return NextResponse.json({ error: "Domain not found" }, { status: 404 });
    }

    await prisma.domain.delete({
      where: { id: domainId },
    });

    await logAuditEvent({
      userId: session.userId,
      action: "DOMAIN_DETACHED",
      resource: "PROJECT",
      resourceId: projectId,
      metadata: { hostname: domain.hostname },
    });

    return NextResponse.json({ success: true, message: "Domain detached" });
  } catch (error) {
    console.error("[API /projects/[id]/domains DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to detach domain" }, { status: 500 });
  }
}
