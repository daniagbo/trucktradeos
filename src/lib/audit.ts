import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

type AuditInput = {
  userId: string;
  action: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  request?: Request;
};

function getIp(request?: Request) {
  if (!request) return null;
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || null;
  }
  return request.headers.get('x-real-ip') || null;
}

export async function logAuditEvent(input: AuditInput) {
  try {
    await db.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityId: input.entityId || null,
        metadata: (input.metadata as Prisma.InputJsonValue | undefined) ?? undefined,
        ip: getIp(input.request),
        userAgent: input.request?.headers.get('user-agent') || null,
      },
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
