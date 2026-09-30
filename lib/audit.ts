import { prisma } from "@/lib/prisma";

export interface LogAuditEventParams {
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAuditEvent({
  userId,
  action,
  resource,
  resourceId,
  metadata,
}: LogAuditEventParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId ?? null,
        action,
        resource,
        resourceId: resourceId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  } catch (error) {
    // Non-blocking error logging
    console.error("[AuditLog] Failed to record audit event:", error);
  }
}
