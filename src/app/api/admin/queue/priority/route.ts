import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { apiError } from '@/lib/api/errors';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

function tierWeight(tier: string) {
  if (tier === 'ENTERPRISE') return 30;
  if (tier === 'PRIORITY') return 20;
  return 10;
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      limit: searchParams.get('limit') || '15',
    });
    if (!validation.success) {
      return apiError(400, 'Invalid query');
    }

    const openRfqs = await db.rFQ.findMany({
      where: {
        status: { in: ['RECEIVED', 'REVIEWING', 'OFFER_SENT', 'PENDING_EXECUTION'] },
      },
      include: {
        offers: {
          where: { status: 'SENT' },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    const now = Date.now();
    const queue = openRfqs
      .map((rfq) => {
        const ageHours = (now - rfq.createdAt.getTime()) / (1000 * 60 * 60);
        const slaTargetHours = rfq.slaTargetHours || 72;
        const slaRatio = ageHours / Math.max(1, slaTargetHours);
        const overdue = ageHours > slaTargetHours;
        const offerCoveragePenalty = rfq.offers.length > 0 ? 0 : 20;
        const score = Math.round(slaRatio * 50 + tierWeight(rfq.serviceTier) + offerCoveragePenalty);

        return {
          id: rfq.id,
          status: rfq.status,
          serviceTier: rfq.serviceTier,
          slaTargetHours,
          ageHours: Math.floor(ageHours),
          overdue,
          hasOffer: rfq.offers.length > 0,
          score,
          category: rfq.category,
          urgency: rfq.urgency,
          createdAt: rfq.createdAt,
        };
      })
      .sort((a, b) => b.score - a.score || b.ageHours - a.ageHours)
      .slice(0, validation.data.limit);

    return NextResponse.json({ queue });
  } catch (error) {
    console.error('Failed to fetch priority queue:', error);
    return apiError(500, 'Failed to fetch priority queue');
  }
}
