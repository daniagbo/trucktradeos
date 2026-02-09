import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { mapOfferModel, toDbOfferStatus, toDbRfqStatus } from '@/lib/rfq-api';
import type { OfferStatus } from '@/lib/types';
import { createAdminNotification, createNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { apiError, apiValidationError } from '@/lib/api/errors';

const patchOfferSchema = z
  .object({
    status: z.enum(['Draft', 'Sent', 'Accepted', 'Declined', 'Expired']),
    reason: z.string().trim().max(2000).optional(),
  })
  .strict();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const { id } = await params;
    const bodyJson = await request.json();
    const validation = patchOfferSchema.safeParse(bodyJson);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }
    const body = validation.data as { status: OfferStatus; reason?: string };

    const offer = await db.offer.findUnique({ where: { id } });
    if (!offer) return apiError(404, 'Offer not found');

    const rfq = await db.rFQ.findUnique({ where: { id: offer.rfqId } });
    if (!rfq) return apiError(404, 'RFQ not found');

    const isAdmin = session.role === 'ADMIN' || session.role === 'admin';
    if (!isAdmin && rfq.userId !== session.userId) {
      return apiError(403, 'Forbidden');
    }

    if (body.status === 'Accepted') {
      await db.$transaction([
        db.offer.updateMany({
          where: { rfqId: offer.rfqId, id: { not: id }, status: 'SENT' },
          data: { status: 'DECLINED', declineReason: 'Another offer was accepted.' },
        }),
        db.offer.update({
          where: { id },
          data: { status: toDbOfferStatus('Accepted') },
        }),
        db.rFQ.update({
          where: { id: offer.rfqId },
          data: {
            status: toDbRfqStatus('Pending execution'),
            events: {
              create: [
                { type: 'status_change', payload: { status: 'Pending execution' } as Prisma.InputJsonValue },
                { type: 'offer_accepted', payload: { offerId: id } as Prisma.InputJsonValue },
              ],
            },
          },
        }),
      ]);
      await createAdminNotification({
        type: 'OFFER',
        title: 'Offer accepted',
        message: `Offer ${id.slice(0, 10)} was accepted by buyer.`,
        metadata: { offerId: id, rfqId: offer.rfqId },
      });
    } else if (body.status === 'Declined') {
      await db.$transaction([
        db.offer.update({
          where: { id },
          data: { status: toDbOfferStatus('Declined'), declineReason: body.reason },
        }),
        db.rFQ.update({
          where: { id: offer.rfqId },
          data: {
            events: {
              create: [
                { type: 'offer_declined', payload: { offerId: id, reason: body.reason || '' } as Prisma.InputJsonValue },
              ],
            },
          },
        }),
      ]);
      await createAdminNotification({
        type: 'OFFER',
        title: 'Offer declined',
        message: `Offer ${id.slice(0, 10)} was declined by buyer.`,
        metadata: { offerId: id, rfqId: offer.rfqId, reason: body.reason || '' },
      });
    } else {
      await db.offer.update({
        where: { id },
        data: { status: toDbOfferStatus(body.status), ...(body.reason ? { declineReason: body.reason } : {}) },
      });
    }

    if (isAdmin && body.status === 'Sent') {
      await createNotification({
        userId: rfq.userId,
        type: 'OFFER',
        title: 'Offer status updated',
        message: `Offer ${id.slice(0, 10)} status changed to ${body.status}.`,
        metadata: { offerId: id, rfqId: offer.rfqId, status: body.status },
      });
    }

    if (isAdmin) {
      await logAuditEvent({
        request,
        userId: session.userId,
        action: 'offer.update',
        entityId: offer.rfqId,
        metadata: {
          offerId: id,
          status: body.status,
          reason: body.reason || null,
        },
      });
    }

    const updated = await db.offer.findUnique({ where: { id } });
    if (!updated) return apiError(404, 'Offer not found after update');
    return NextResponse.json({ offer: mapOfferModel(updated) });
  } catch (error) {
    console.error('Failed to update offer:', error);
    return apiError(500, 'Failed to update offer');
  }
}
