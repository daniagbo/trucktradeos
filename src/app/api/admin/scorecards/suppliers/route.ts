import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { apiError } from '@/lib/api/errors';

function isAdmin(role: string | undefined) {
  return role === 'admin' || role === 'ADMIN';
}

type SupplierBucket = {
  supplierId: string;
  supplierName: string;
  country: string;
  offersSent: number;
  offersAccepted: number;
  offersDeclined: number;
  won: number;
  lost: number;
  responseHours: number[];
};

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const offers = await db.offer.findMany({
      where: {
        status: { in: ['SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'] },
        listingId: { not: null },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        listingId: true,
        rfq: {
          select: {
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const listingIds = Array.from(
      new Set(
        offers
          .map((offer) => offer.listingId)
          .filter((id): id is string => Boolean(id))
      )
    );

    const listings = await db.listing.findMany({
      where: { id: { in: listingIds } },
      select: {
        id: true,
        brand: true,
        country: true,
        creatorId: true,
        creator: {
          select: {
            name: true,
            companyName: true,
          },
        },
      },
    });
    const listingMap = new Map(listings.map((listing) => [listing.id, listing]));

    const buckets = new Map<string, SupplierBucket>();

    for (const offer of offers) {
      if (!offer.listingId) continue;
      const listing = listingMap.get(offer.listingId);
      if (!listing) continue;

      const supplierId = listing.creatorId || `brand:${listing.brand}`;
      const supplierName =
        listing.creator.companyName || listing.creator.name || listing.brand;
      const country = listing.country;

      if (!buckets.has(supplierId)) {
        buckets.set(supplierId, {
          supplierId,
          supplierName,
          country,
          offersSent: 0,
          offersAccepted: 0,
          offersDeclined: 0,
          won: 0,
          lost: 0,
          responseHours: [],
        });
      }

      const bucket = buckets.get(supplierId)!;
      bucket.offersSent += 1;
      if (offer.status === 'ACCEPTED') bucket.offersAccepted += 1;
      if (offer.status === 'DECLINED') bucket.offersDeclined += 1;
      if (offer.rfq.status === 'WON') bucket.won += 1;
      if (offer.rfq.status === 'LOST') bucket.lost += 1;

      const responseHours =
        (offer.createdAt.getTime() - offer.rfq.createdAt.getTime()) / (1000 * 60 * 60);
      if (Number.isFinite(responseHours) && responseHours >= 0) {
        bucket.responseHours.push(responseHours);
      }
    }

    const scorecards = Array.from(buckets.values())
      .map((bucket) => {
        const acceptedRate =
          bucket.offersSent > 0
            ? Math.round((bucket.offersAccepted / bucket.offersSent) * 100)
            : 0;
        const totalClosed = bucket.won + bucket.lost;
        const winRate = totalClosed > 0 ? Math.round((bucket.won / totalClosed) * 100) : 0;
        const avgResponseHours =
          bucket.responseHours.length > 0
            ? Number(
                (
                  bucket.responseHours.reduce((sum, value) => sum + value, 0) /
                  bucket.responseHours.length
                ).toFixed(1)
              )
            : null;

        return {
          supplierId: bucket.supplierId,
          supplierName: bucket.supplierName,
          country: bucket.country,
          offersSent: bucket.offersSent,
          offersAccepted: bucket.offersAccepted,
          offersDeclined: bucket.offersDeclined,
          acceptanceRate: acceptedRate,
          winRate,
          avgResponseHours,
        };
      })
      .sort((a, b) => b.acceptanceRate - a.acceptanceRate || b.offersSent - a.offersSent)
      .slice(0, 8);

    return NextResponse.json({ scorecards });
  } catch (error) {
    console.error('Failed to compute supplier scorecards:', error);
    return apiError(500, 'Internal Server Error');
  }
}
