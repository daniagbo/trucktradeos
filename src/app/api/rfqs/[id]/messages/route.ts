import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { mapMessageModel } from '@/lib/rfq-api';
import { createAdminNotification, createNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { apiError, apiValidationError } from '@/lib/api/errors';

const createMessageSchema = z
  .object({
    senderType: z.enum(['buyer', 'admin']),
    message: z.string().trim().min(1).max(5000),
  })
  .strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const { id } = await params;
    const bodyJson = await request.json();
    const validation = createMessageSchema.safeParse(bodyJson);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }
    const body = validation.data;

    const rfq = await db.rFQ.findUnique({ where: { id } });
    if (!rfq) return apiError(404, 'RFQ not found');

    const isAdmin = session.role === 'ADMIN' || session.role === 'admin';
    if (!isAdmin && rfq.userId !== session.userId) {
      return apiError(403, 'Forbidden');
    }

    const senderType = body.senderType === 'admin' && isAdmin ? 'admin' : 'buyer';

    const updated = await db.rFQ.update({
      where: { id },
      data: {
        messages: {
          create: {
            senderType,
            message: body.message,
          },
        },
        events: {
          create: {
            type: 'message',
            payload: { message: body.message, author: senderType === 'admin' ? 'Admin' : 'Buyer' } as Prisma.InputJsonValue,
          },
        },
      },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    });

    const createdMessage = updated.messages[0];

    if (senderType === 'buyer') {
      await createAdminNotification({
        type: 'RFQ',
        title: 'Buyer message',
        message: `New buyer message on RFQ ${rfq.id.slice(0, 10)}.`,
        metadata: { rfqId: rfq.id },
      });
    } else {
      await createNotification({
        userId: rfq.userId,
        type: 'RFQ',
        title: 'Admin replied',
        message: `Admin sent a new message on RFQ ${rfq.id.slice(0, 10)}.`,
        metadata: { rfqId: rfq.id },
      });
    }

    if (isAdmin && senderType === 'admin') {
      await logAuditEvent({
        request,
        userId: session.userId,
        action: 'rfq.message',
        entityId: rfq.id,
        metadata: {
          messageId: createdMessage.id,
        },
      });
    }

    return NextResponse.json({ message: mapMessageModel(createdMessage) });
  } catch (error) {
    console.error('Failed to add message:', error);
    return apiError(500, 'Failed to add message');
  }
}
