import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { apiError } from '@/lib/api/errors';

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const organizationId = await ensureUserOrganization(session.userId);
    if (!organizationId) {
      return NextResponse.json({
        summary: null,
        tierPerformance: [],
        lossReasons: [],
        responseDistribution: [],
      });
    }

    const rfqs = await db.rFQ.findMany({
      where: { user: { organizationId } },
      include: {
        offers: {
          select: { id: true, status: true, createdAt: true, price: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const totalRfqs = rfqs.length;
    const withOffer = rfqs.filter((rfq) => rfq.offers.length > 0).length;
    const won = rfqs.filter((rfq) => rfq.status === 'WON').length;
    const lost = rfqs.filter((rfq) => rfq.status === 'LOST').length;

    const firstResponseHours = rfqs
      .filter((rfq) => rfq.offers.length > 0)
      .map((rfq) => (rfq.offers[0].createdAt.getTime() - rfq.createdAt.getTime()) / (1000 * 60 * 60))
      .filter((value) => Number.isFinite(value) && value >= 0);

    const responseDistribution = [
      { bucket: '<8h', count: firstResponseHours.filter((h) => h < 8).length },
      { bucket: '8-24h', count: firstResponseHours.filter((h) => h >= 8 && h < 24).length },
      { bucket: '24-72h', count: firstResponseHours.filter((h) => h >= 24 && h < 72).length },
      { bucket: '>72h', count: firstResponseHours.filter((h) => h >= 72).length },
    ];

    const tierPerformance = ['STANDARD', 'PRIORITY', 'ENTERPRISE'].map((tier) => {
      const scoped = rfqs.filter((rfq) => rfq.serviceTier === tier);
      const closed = scoped.filter((rfq) => rfq.status === 'WON' || rfq.status === 'LOST');
      const wonCount = scoped.filter((rfq) => rfq.status === 'WON').length;
      const offerCoverage = percent(scoped.filter((rfq) => rfq.offers.length > 0).length, Math.max(1, scoped.length));
      const winRate = percent(wonCount, Math.max(1, closed.length));
      const avgPrice = scoped
        .flatMap((rfq) => rfq.offers.map((offer) => offer.price).filter((price): price is number => typeof price === 'number'))
        .reduce(
          (acc, value, _idx, arr) => ({ sum: acc.sum + value, count: arr.length }),
          { sum: 0, count: 0 }
        );
      return {
        tier,
        rfqCount: scoped.length,
        offerCoverage,
        winRate,
        avgOfferPrice:
          avgPrice.count > 0 ? Number((avgPrice.sum / avgPrice.count).toFixed(0)) : null,
      };
    });

    const lossReasons = await db.rFQ.groupBy({
      by: ['closeReason'],
      where: {
        user: { organizationId },
        status: 'LOST',
      },
      _count: { _all: true },
      orderBy: { _count: { closeReason: 'desc' } },
      take: 6,
    });

    return NextResponse.json({
      summary: {
        totalRfqs,
        offerCoverageRate: percent(withOffer, Math.max(1, totalRfqs)),
        winRate: percent(won, Math.max(1, won + lost)),
        lostRate: percent(lost, Math.max(1, won + lost)),
      },
      tierPerformance,
      lossReasons: lossReasons.map((row) => ({
        reason: row.closeReason || 'Unspecified',
        count: row._count._all,
      })),
      responseDistribution,
    });
  } catch (error) {
    console.error('Failed to build commercial insights:', error);
    return apiError(500, 'Failed to build commercial insights');
  }
}
