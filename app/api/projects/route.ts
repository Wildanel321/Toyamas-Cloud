import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { createProjectSchema } from "@/lib/projects/validation";
import { logAuditEvent } from "@/lib/audit";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projects = await prisma.project.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: {
            deployments: true,
            domains: true,
            environmentVariables: true,
          },
        },
        deployments: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            commitHash: true,
            createdAt: true,
          },
        },
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[API /projects GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = createProjectSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data = result.data;
    const baseDomain = process.env.BASE_DOMAIN || "wildanstore.my.id";
    const defaultDomain = `${data.slug}.${baseDomain}`;

    // Check slug uniqueness
    const existing = await prisma.project.findUnique({
      where: { slug: data.slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Project slug '${data.slug}' is already taken. Please choose another.` },
        { status: 409 }
      );
    }

    // Generate random webhook secret
    const webhookSecret = crypto.randomBytes(24).toString("hex");

    // Create project and attach default domain
    const project = await prisma.project.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        repositoryUrl: data.repositoryUrl,
        branch: data.branch,
        runtime: data.runtime,
        containerPort: data.containerPort,
        cpuLimit: data.cpuLimit,
        memoryLimit: data.memoryLimit,
        autoDeploy: data.autoDeploy,
        domain: defaultDomain,
        webhookSecret,
        domains: {
          create: {
            hostname: defaultDomain,
            status: "ACTIVE",
            sslStatus: "ACTIVE",
          },
        },
      },
      include: {
        domains: true,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      action: "PROJECT_CREATED",
      resource: "PROJECT",
      resourceId: project.id,
      metadata: { name: project.name, slug: project.slug, runtime: project.runtime },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error("[API /projects POST] Error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
