import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { mapOfferModel, toDbRfqStatus } from '@/lib/rfq-api';
import type { Offer } from '@/lib/types';
import { createNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { apiError, apiValidationError } from '@/lib/api/errors';

const createOfferSchema = z
  .object({
    rfqId: z.string().optional(),
    listingId: z.string().optional(),
    title: z.string().trim().min(1).max(140),
    price: z.number().optional(),
    currency: z.string().trim().min(3).max(8).optional(),
    terms: z.string().trim().max(2000).optional(),
    location: z.string().trim().max(120).optional(),
    availabilityText: z.string().trim().max(2000).optional(),
    validUntil: z.union([z.string().datetime(), z.string().min(4)]),
    includedFlags: z.record(z.string(), z.boolean()).optional(),
    notes: z.string().trim().max(5000).optional(),
  })
  .strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    const isAdmin = session?.role === 'ADMIN' || session?.role === 'admin';
    if (!session?.userId || !isAdmin) {
      return apiError(401, 'Unauthorized');
    }

    const { id } = await params;
    const bodyJson = await request.json();
    const validation = createOfferSchema.safeParse(bodyJson);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }
    const body = validation.data as Omit<Offer, 'id' | 'createdAt' | 'status' | 'versionNumber'>;

    const rfq = await db.rFQ.findUnique({
      where: { id },
      include: { offers: true },
    });
    if (!rfq) return apiError(404, 'RFQ not found');

    const versionNumber = rfq.offers.length > 0 ? Math.max(...rfq.offers.map((offer: (typeof rfq.offers)[number]) => offer.versionNumber)) + 1 : 1;

    const updated = await db.rFQ.update({
      where: { id },
      data: {
        status: toDbRfqStatus('Offer sent'),
        offers: {
          create: {
            listingId: body.listingId,
            title: body.title,
            price: body.price,
            currency: body.currency || 'USD',
            terms: body.terms,
            location: body.location,
            availabilityText: body.availabilityText,
            validUntil: new Date(body.validUntil),
            notes: body.notes,
            includedFlags: body.includedFlags || {},
            versionNumber,
            sentAt: new Date(),
            status: 'SENT',
          },
        },
        events: {
          create: [
            { type: 'status_change', payload: { status: 'Offer sent' } as Prisma.InputJsonValue },
            { type: 'offer_sent', payload: { title: body.title } as Prisma.InputJsonValue },
          ],
        },
      },
      include: {
        offers: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    await createNotification({
      userId: rfq.userId,
      type: 'OFFER',
      title: 'New offer received',
      message: `A new offer was sent for RFQ ${rfq.id.slice(0, 10)}.`,
      metadata: { rfqId: rfq.id },
    });

    await logAuditEvent({
      request,
      userId: session.userId,
      action: 'offer.create',
      entityId: rfq.id,
      metadata: {
        offerId: updated.offers[0]?.id,
        title: body.title,
        versionNumber,
      },
    });

    return NextResponse.json({ offer: mapOfferModel(updated.offers[0]) });
  } catch (error) {
    console.error('Failed to create offer:', error);
    return apiError(500, 'Failed to create offer');
  }
}
