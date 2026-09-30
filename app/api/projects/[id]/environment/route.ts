import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentSession } from "@/lib/auth/session";
import { envVariableSchema } from "@/lib/projects/validation";
import { encryptSecret, decryptSecret } from "@/lib/auth/crypto";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const bulkEnvSchema = z.object({
  variables: z.array(
    z.object({
      key: z.string().min(1).regex(/^[A-Z0-9_]+$/i),
      value: z.string(),
      isSecret: z.boolean().default(true),
    })
  ),
});

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
    const revealKey = searchParams.get("reveal");

    const variables = await prisma.environmentVariable.findMany({
      where: { projectId },
      orderBy: { key: "asc" },
    });

    // Mask secret values by default unless specifically requesting a single key reveal
    const formatted = variables.map((v) => {
      let displayValue = "••••••••••••";
      if (!v.isSecret || (revealKey && revealKey === v.key)) {
        try {
          displayValue = decryptSecret(v.encryptedValue);
        } catch {
          displayValue = "[Decryption Error]";
        }
      }
      return {
        id: v.id,
        key: v.key,
        value: displayValue,
        isSecret: v.isSecret,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    });

    return NextResponse.json({ variables: formatted });
  } catch (error) {
    console.error("[API /projects/[id]/environment GET] Error:", error);
    return NextResponse.json({ error: "Failed to fetch environment variables" }, { status: 500 });
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

    // Check if bulk or single
    if (body.variables && Array.isArray(body.variables)) {
      const parsed = bulkEnvSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0]?.message || "Validation failed" },
          { status: 400 }
        );
      }

      for (const item of parsed.data.variables) {
        const encryptedValue = encryptSecret(item.value);
        await prisma.environmentVariable.upsert({
          where: {
            projectId_key: {
              projectId,
              key: item.key.toUpperCase().trim(),
            },
          },
          update: {
            encryptedValue,
            isSecret: item.isSecret,
          },
          create: {
            projectId,
            key: item.key.toUpperCase().trim(),
            encryptedValue,
            isSecret: item.isSecret,
          },
        });
      }

      await logAuditEvent({
        userId: session.userId,
        action: "ENV_VARS_BULK_UPDATED",
        resource: "PROJECT",
        resourceId: projectId,
        metadata: { count: parsed.data.variables.length },
      });

      return NextResponse.json({ success: true, message: "Variables saved successfully" });
    }

    // Single variable create/update
    const result = envVariableSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const { key, value, isSecret } = result.data;
    const normalizedKey = key.toUpperCase().trim();
    const encryptedValue = encryptSecret(value);

    const variable = await prisma.environmentVariable.upsert({
      where: {
        projectId_key: {
          projectId,
          key: normalizedKey,
        },
      },
      update: {
        encryptedValue,
        isSecret,
      },
      create: {
        projectId,
        key: normalizedKey,
        encryptedValue,
        isSecret,
      },
    });

    await logAuditEvent({
      userId: session.userId,
      action: "ENV_VAR_SET",
      resource: "PROJECT",
      resourceId: projectId,
      metadata: { key: normalizedKey, isSecret },
    });

    return NextResponse.json({
      variable: {
        id: variable.id,
        key: variable.key,
        isSecret: variable.isSecret,
        createdAt: variable.createdAt,
      },
    });
  } catch (error) {
    console.error("[API /projects/[id]/environment POST] Error:", error);
    return NextResponse.json({ error: "Failed to save environment variable" }, { status: 500 });
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
    const varId = searchParams.get("varId");
    const key = searchParams.get("key");

    if (!varId && !key) {
      return NextResponse.json({ error: "Variable ID or key is required" }, { status: 400 });
    }

    if (varId) {
      await prisma.environmentVariable.delete({
        where: { id: varId, projectId },
      });
    } else if (key) {
      await prisma.environmentVariable.delete({
        where: {
          projectId_key: {
            projectId,
            key: key.toUpperCase().trim(),
          },
        },
      });
    }

    await logAuditEvent({
      userId: session.userId,
      action: "ENV_VAR_DELETED",
      resource: "PROJECT",
      resourceId: projectId,
      metadata: { varId, key },
    });

    return NextResponse.json({ success: true, message: "Variable removed" });
  } catch (error) {
    console.error("[API /projects/[id]/environment DELETE] Error:", error);
    return NextResponse.json({ error: "Failed to delete environment variable" }, { status: 500 });
  }
}
