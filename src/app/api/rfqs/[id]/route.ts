import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { mapRfqModel, toDbRfqStatus } from '@/lib/rfq-api';
import type { RFQStatus } from '@/lib/types';
import { createAdminNotification, createNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api/errors';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const { id } = await params;
    const body = (await request.json()) as {
      status?: RFQStatus;
      internalOpsNotes?: string;
      closeStatus?: 'Won' | 'Lost';
      closeReason?: string;
      serviceTier?: 'Standard' | 'Priority' | 'Enterprise';
      servicePackage?: 'Core' | 'Concierge' | 'Command';
      packageAddons?: Array<'Verification' | 'Logistics' | 'Financing' | 'Compliance' | 'DedicatedManager'>;
    };

    const existing = await db.rFQ.findUnique({
      where: { id },
      include: {
        events: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });
    if (!existing) {
      return apiError(404, 'RFQ not found');
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'admin';
    if (!isAdmin && existing.userId !== session.userId) {
      return apiError(403, 'Forbidden');
    }

    const statusToApply = body.closeStatus ?? body.status;
    const slaTargetHours =
      body.serviceTier === 'Enterprise' ? 8 : body.serviceTier === 'Priority' ? 24 : body.serviceTier === 'Standard' ? 72 : undefined;
    const latestPayloadEvent = [...existing.events].reverse().find((event) => event.type === 'rfq_payload');
    const latestPayload = (latestPayloadEvent?.payload || {}) as Record<string, unknown>;
    const hasPackageUpdate = Boolean(body.servicePackage) || Array.isArray(body.packageAddons);
    const priorServiceTier = typeof latestPayload.serviceTier === 'string' ? latestPayload.serviceTier : undefined;
    const priorServicePackage = typeof latestPayload.servicePackage === 'string' ? latestPayload.servicePackage : undefined;
    const priorPackageAddons = Array.isArray(latestPayload.packageAddons) ? latestPayload.packageAddons : undefined;
    const nextPayload: Prisma.InputJsonValue | null = hasPackageUpdate
      ? ({
          ...latestPayload,
          servicePackage: body.servicePackage || priorServicePackage || 'Core',
          packageAddons: body.packageAddons || priorPackageAddons || [],
          serviceTier: body.serviceTier || priorServiceTier,
        } as Prisma.InputJsonValue)
      : null;

    const updated = await db.rFQ.update({
      where: { id },
      data: {
        ...(statusToApply ? { status: toDbRfqStatus(statusToApply) } : {}),
        ...(body.serviceTier ? { serviceTier: body.serviceTier.toUpperCase() as 'STANDARD' | 'PRIORITY' | 'ENTERPRISE' } : {}),
        ...(typeof slaTargetHours === 'number' ? { slaTargetHours } : {}),
        ...(typeof body.internalOpsNotes === 'string' ? { internalOpsNotes: body.internalOpsNotes } : {}),
        ...(body.closeReason ? { closeReason: body.closeReason } : {}),
        events: {
          create: [
            ...(statusToApply
              ? [{ type: 'status_change', payload: { status: statusToApply } as Prisma.InputJsonValue }]
              : []),
            ...(body.closeStatus
              ? [
                  {
                    type: 'rfq_closed',
                    payload: { status: body.closeStatus, reason: body.closeReason || '' } as Prisma.InputJsonValue,
                  },
                ]
              : []),
            ...(nextPayload ? [{ type: 'rfq_payload', payload: nextPayload }] : []),
          ],
        },
      },
      include: {
        offers: true,
        messages: true,
        events: { orderBy: { timestamp: 'asc' } },
      },
    });

    if (body.closeStatus) {
      await createAdminNotification({
        type: 'RFQ',
        title: `RFQ closed as ${body.closeStatus}`,
        message: `RFQ ${id.slice(0, 10)} was closed.`,
        metadata: { rfqId: id, status: body.closeStatus, reason: body.closeReason || '' },
      });
      await createNotification({
        userId: existing.userId,
        type: 'RFQ',
        title: `Request closed as ${body.closeStatus}`,
        message: `Your RFQ ${id.slice(0, 10)} has been closed.`,
        metadata: { rfqId: id, status: body.closeStatus, reason: body.closeReason || '' },
      });
    } else if (body.status && isAdmin) {
      await createNotification({
        userId: existing.userId,
        type: 'RFQ',
        title: 'RFQ status updated',
        message: `RFQ ${id.slice(0, 10)} moved to ${body.status}.`,
        metadata: { rfqId: id, status: body.status },
      });
    }

    if (isAdmin) {
      await logAuditEvent({
        request,
        userId: session.userId,
        action: body.closeStatus ? 'rfq.close' : 'rfq.update',
        entityId: id,
        metadata: {
          status: body.status,
          closeStatus: body.closeStatus,
          closeReason: body.closeReason,
          serviceTier: body.serviceTier,
          servicePackage: body.servicePackage,
          packageAddons: body.packageAddons,
          slaTargetHours,
          updatedInternalNote: typeof body.internalOpsNotes === 'string',
        },
      });
    }

    return NextResponse.json({ rfq: mapRfqModel(updated as Parameters<typeof mapRfqModel>[0]) });
  } catch (error) {
    console.error('Failed to update RFQ:', error);
    return apiError(500, 'Failed to update RFQ');
  }
}
