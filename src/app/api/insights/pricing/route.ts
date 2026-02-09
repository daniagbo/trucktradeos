import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { apiError } from '@/lib/api/errors';

const CATEGORY_TO_DB: Record<string, 'TRUCK' | 'TRAILER' | 'HEAVY_EQUIPMENT'> = {
  Truck: 'TRUCK',
  Trailer: 'TRAILER',
  'Heavy Equipment': 'HEAVY_EQUIPMENT',
  TRUCK: 'TRUCK',
  TRAILER: 'TRAILER',
  HEAVY_EQUIPMENT: 'HEAVY_EQUIPMENT',
};

function percentile(sorted: number[], p: number) {
  if (sorted.length === 0) return null;
  const index = (sorted.length - 1) * p;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  const weight = index - lower;
  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'Truck';
    const brand = searchParams.get('brand');
    const country = searchParams.get('country');

    const listingCandidates = await db.listing.findMany({
      where: {
        category: CATEGORY_TO_DB[category] || 'TRUCK',
        ...(brand
          ? {
              brand: { contains: brand, mode: 'insensitive' },
            }
          : {}),
        ...(country
          ? {
              country: { contains: country, mode: 'insensitive' },
            }
          : {}),
      },
      select: {
        id: true,
        pricePerUnit: true,
      },
      take: 500,
    });

    const listingIds = listingCandidates.map((listing) => listing.id);
    const listingPrices = listingCandidates
      .map((listing) => listing.pricePerUnit)
      .filter((price): price is number => typeof price === 'number' && price > 0);

    const offerPrices = listingIds.length
      ? (
          await db.offer.findMany({
            where: {
              listingId: { in: listingIds },
              price: { not: null },
              status: { in: ['SENT', 'ACCEPTED', 'DECLINED', 'EXPIRED'] },
            },
            select: { price: true },
            take: 500,
          })
        )
          .map((offer) => offer.price)
          .filter((price): price is number => typeof price === 'number' && price > 0)
      : [];

    const prices = [...listingPrices, ...offerPrices].sort((a, b) => a - b);
    if (prices.length < 3) {
      return NextResponse.json({
        benchmark: {
          sampleSize: prices.length,
          p25: null,
          median: null,
          p75: null,
          min: null,
          max: null,
          confidence: 'low',
        },
      });
    }

    const p25 = percentile(prices, 0.25);
    const median = percentile(prices, 0.5);
    const p75 = percentile(prices, 0.75);
    const confidence = prices.length >= 30 ? 'high' : prices.length >= 10 ? 'medium' : 'low';

    return NextResponse.json({
      benchmark: {
        sampleSize: prices.length,
        p25: p25 ? Math.round(p25) : null,
        median: median ? Math.round(median) : null,
        p75: p75 ? Math.round(p75) : null,
        min: Math.round(prices[0]),
        max: Math.round(prices[prices.length - 1]),
        confidence,
      },
    });
  } catch (error) {
    console.error('Failed to compute pricing benchmark:', error);
    return apiError(500, 'Internal Server Error');
  }
}
