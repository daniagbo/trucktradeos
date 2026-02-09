import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { apiError } from '@/lib/api/errors';

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

type PayloadSummary = {
  mandateCompleteness?: number;
};

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const organizationId = await ensureUserOrganization(session.userId);
    if (!organizationId) {
      return NextResponse.json({
        summary: null,
        funnel: [],
        trend: [],
        backlog: [],
        deliverables: null,
        blockers: [],
      });
    }

    const now = Date.now();
    const rfqs = await db.rFQ.findMany({
      where: { user: { organizationId } },
      include: {
        offers: {
          select: { id: true, createdAt: true, status: true },
        },
        events: {
          where: { type: 'rfq_payload' },
          select: { payload: true },
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    });

    const openStatuses = new Set(['RECEIVED', 'REVIEWING', 'OFFER_SENT', 'PENDING_EXECUTION']);
    const funnelBuckets = ['RECEIVED', 'REVIEWING', 'OFFER_SENT', 'PENDING_EXECUTION', 'WON', 'LOST'];
    const funnel = funnelBuckets.map((status) => ({
      status,
      count: rfqs.filter((rfq) => rfq.status === status).length,
    }));

    const withOffer = rfqs.filter((rfq) => rfq.offers.length > 0).length;
    const offerCoverageRate = rfqs.length > 0 ? Math.round((withOffer / rfqs.length) * 100) : 0;

    const firstOfferHours = rfqs
      .map((rfq) => {
        if (rfq.offers.length === 0) return null;
        const firstOffer = [...rfq.offers].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
        return (firstOffer.createdAt.getTime() - rfq.createdAt.getTime()) / (1000 * 60 * 60);
      })
      .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value >= 0);
    const avgFirstOfferHours =
      firstOfferHours.length > 0
        ? Number((firstOfferHours.reduce((sum, value) => sum + value, 0) / firstOfferHours.length).toFixed(1))
        : null;

    const closed = rfqs.filter((rfq) => rfq.status === 'WON' || rfq.status === 'LOST');
    const cycleHours = closed
      .map((rfq) => (rfq.updatedAt.getTime() - rfq.createdAt.getTime()) / (1000 * 60 * 60))
      .filter((value) => Number.isFinite(value) && value >= 0);
    const avgCycleHours =
      cycleHours.length > 0
        ? Number((cycleHours.reduce((sum, value) => sum + value, 0) / cycleHours.length).toFixed(1))
        : null;
    const winRate = closed.length > 0 ? Math.round((closed.filter((rfq) => rfq.status === 'WON').length / closed.length) * 100) : 0;

    const mandateScores = rfqs
      .map((rfq) => {
        const event = rfq.events[0];
        if (!event) return null;
        const payload = event.payload as PayloadSummary;
        return typeof payload.mandateCompleteness === 'number' ? payload.mandateCompleteness : null;
      })
      .filter((value): value is number => typeof value === 'number');
    const avgMandateCompleteness =
      mandateScores.length > 0
        ? Math.round(mandateScores.reduce((sum, value) => sum + value, 0) / mandateScores.length)
        : null;

    const backlog = ['STANDARD', 'PRIORITY', 'ENTERPRISE'].map((serviceTier) => {
      const scoped = rfqs.filter((rfq) => rfq.serviceTier === serviceTier && openStatuses.has(rfq.status));
      const overdue = scoped.filter((rfq) => {
        const ageHours = (now - rfq.createdAt.getTime()) / (1000 * 60 * 60);
        return ageHours > Math.max(1, rfq.slaTargetHours || 72);
      }).length;
      return {
        serviceTier,
        open: scoped.length,
        overdue,
      };
    });

    const currentWeekStart = startOfWeek(new Date());
    const weekStarts = Array.from({ length: 8 }).map((_, index) => {
      const d = new Date(currentWeekStart);
      d.setDate(d.getDate() - index * 7);
      return d;
    });
    const trend = weekStarts
      .map((weekStart) => {
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const created = rfqs.filter((rfq) => rfq.createdAt >= weekStart && rfq.createdAt < weekEnd).length;
        const closedCount = rfqs.filter(
          (rfq) =>
            (rfq.status === 'WON' || rfq.status === 'LOST') &&
            rfq.updatedAt >= weekStart &&
            rfq.updatedAt < weekEnd
        ).length;
        return {
          weekStart: toIsoDate(weekStart),
          created,
          closed: closedCount,
        };
      })
      .reverse();

    const [deliverableAgg, blockersRaw] = await Promise.all([
      db.deliverable.groupBy({
        by: ['status'],
        where: { rfq: { user: { organizationId } } },
        _count: { _all: true },
      }),
      db.opsTask.groupBy({
        by: ['source', 'priority'],
        where: {
          organizationId,
          status: { in: ['OPEN', 'ACKNOWLEDGED'] },
        },
        _count: { _all: true },
      }),
    ]);

    const deliverableTotal = deliverableAgg.reduce((sum, row) => sum + row._count._all, 0);
    const deliverableDone =
      deliverableAgg.find((row) => row.status === 'DONE')?._count._all || 0;
    const deliverables = {
      total: deliverableTotal,
      done: deliverableDone,
      completionRate: deliverableTotal > 0 ? Math.round((deliverableDone / deliverableTotal) * 100) : 0,
    };

    const blockers = blockersRaw
      .map((row) => ({
        source: row.source,
        priority: row.priority,
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return NextResponse.json({
      summary: {
        totalRfqs: rfqs.length,
        openRfqs: rfqs.filter((rfq) => openStatuses.has(rfq.status)).length,
        winRate,
        offerCoverageRate,
        avgFirstOfferHours,
        avgCycleHours,
        avgMandateCompleteness,
      },
      funnel,
      trend,
      backlog,
      deliverables,
      blockers,
    });
  } catch (error) {
    console.error('Failed to compute executive insights:', error);
    return apiError(500, 'Failed to compute executive insights');
  }
}
