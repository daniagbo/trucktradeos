import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { apiError } from '@/lib/api/errors';

function percent(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((value / total) * 100);
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        accountType: true,
        companyName: true,
        phone: true,
        country: true,
        vat: true,
        headline: true,
        bio: true,
        website: true,
        linkedinUrl: true,
      },
    });

    const rfqs = await db.rFQ.findMany({
      where: { userId: session.userId },
      select: {
        id: true,
        status: true,
        createdAt: true,
        offers: {
          select: { createdAt: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalRfqs = rfqs.length;
    const activeRfqs = rfqs.filter((rfq) =>
      ['RECEIVED', 'REVIEWING', 'OFFER_SENT', 'PENDING_EXECUTION'].includes(rfq.status)
    ).length;
    const wonRfqs = rfqs.filter((rfq) => rfq.status === 'WON').length;
    const lostRfqs = rfqs.filter((rfq) => rfq.status === 'LOST').length;
    const closedRfqs = wonRfqs + lostRfqs;

    const offersReceived = rfqs.reduce((sum, rfq) => sum + rfq.offers.length, 0);
    const firstOfferHours = rfqs
      .filter((rfq) => rfq.offers.length > 0)
      .map((rfq) => (rfq.offers[0].createdAt.getTime() - rfq.createdAt.getTime()) / (1000 * 60 * 60))
      .filter((value) => Number.isFinite(value) && value >= 0);

    const avgFirstOfferHours =
      firstOfferHours.length > 0
        ? Number((firstOfferHours.reduce((sum, value) => sum + value, 0) / firstOfferHours.length).toFixed(1))
        : null;

    const profileFields = [
      Boolean(user?.phone),
      Boolean(user?.country),
      Boolean(user?.headline),
      Boolean(user?.bio),
      Boolean(user?.website),
      Boolean(user?.linkedinUrl),
      user?.accountType === 'COMPANY' ? Boolean(user?.companyName) : true,
      user?.accountType === 'COMPANY' ? Boolean(user?.vat) : true,
    ];
    const profileCompleteness = percent(
      profileFields.filter(Boolean).length,
      profileFields.length
    );

    const reliabilityScore =
      avgFirstOfferHours === null
        ? 0
        : clamp(Math.round(((72 - Math.min(72, avgFirstOfferHours)) / 72) * 100), 0, 100);
    const engagementScore = clamp(percent(Math.min(offersReceived, Math.max(1, totalRfqs * 2)), Math.max(1, totalRfqs * 2)), 0, 100);
    const outcomesScore = closedRfqs > 0 ? percent(wonRfqs, closedRfqs) : 0;
    const trustScore = Math.round(
      profileCompleteness * 0.4 +
        reliabilityScore * 0.25 +
        outcomesScore * 0.2 +
        engagementScore * 0.15
    );

    const badges: string[] = [];
    if (profileCompleteness >= 90) badges.push('Profile Complete');
    if (offersReceived >= 5) badges.push('High Engagement');
    if (closedRfqs >= 3) badges.push('Experienced Buyer');
    if (closedRfqs > 0 && percent(wonRfqs, closedRfqs) >= 50) badges.push('Strong Conversion');
    if (trustScore >= 80) badges.push('Trusted Buyer');
    if (reliabilityScore >= 70) badges.push('Fast Responder');
    if (user?.accountType === 'COMPANY' && user?.companyName && user?.vat) badges.push('Verified Organization');

    return NextResponse.json({
      trackRecord: {
        totalRfqs,
        activeRfqs,
        closedRfqs,
        wonRfqs,
        lostRfqs,
        winRate: percent(wonRfqs, closedRfqs),
        offersReceived,
        avgFirstOfferHours,
        profileCompleteness,
        trustScore,
        trustBreakdown: {
          profileCompleteness,
          reliabilityScore,
          outcomesScore,
          engagementScore,
        },
        badges,
      },
    });
  } catch (error) {
    console.error('Failed to fetch track record:', error);
    return apiError(500, 'Failed to fetch track record');
  }
}
