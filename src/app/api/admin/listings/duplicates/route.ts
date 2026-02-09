import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api/errors';

const querySchema = z.object({
  title: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  model: z.string().trim().optional(),
  category: z.enum(['TRUCK', 'TRAILER', 'HEAVY_EQUIPMENT']).optional(),
  year: z.coerce.number().int().optional(),
  excludeId: z.string().optional(),
});

function isAdmin(role: string | undefined) {
  return role === 'admin' || role === 'ADMIN';
}

function normalize(input: string | null | undefined) {
  return (input || '').trim().toLowerCase();
}

function titleTokens(input: string | undefined) {
  return normalize(input)
    .split(/[\s\-_/]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      title: searchParams.get('title') || undefined,
      brand: searchParams.get('brand') || undefined,
      model: searchParams.get('model') || undefined,
      category: searchParams.get('category') || undefined,
      year: searchParams.get('year') || undefined,
      excludeId: searchParams.get('excludeId') || undefined,
    });

    if (!parsed.success) {
      return apiError(400, 'Invalid query');
    }

    const data = parsed.data;
    const title = data.title || '';
    const brand = data.brand || '';
    const model = data.model || '';
    const tokens = titleTokens(title);

    if (!title && !brand && !model) {
      return NextResponse.json({ duplicates: [] });
    }

    const orClauses: Prisma.ListingWhereInput[] = [];
    if (title) {
      orClauses.push({
        title: {
          contains: title,
          mode: 'insensitive',
        },
      });
    }
    for (const token of tokens) {
      orClauses.push({
        title: {
          contains: token,
          mode: 'insensitive',
        },
      });
    }
    if (brand) {
      orClauses.push({
        brand: {
          contains: brand,
          mode: 'insensitive',
        },
      });
    }
    if (model) {
      orClauses.push({
        model: {
          contains: model,
          mode: 'insensitive',
        },
      });
    }

    const candidates = await db.listing.findMany({
      where: {
        id: data.excludeId ? { not: data.excludeId } : undefined,
        OR: orClauses,
      },
      select: {
        id: true,
        title: true,
        brand: true,
        model: true,
        year: true,
        category: true,
        country: true,
        city: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
    });

    const brandNorm = normalize(brand);
    const modelNorm = normalize(model);
    const titleNorm = normalize(title);

    const ranked = candidates
      .map((listing) => {
        const listingTitle = normalize(listing.title);
        const listingBrand = normalize(listing.brand);
        const listingModel = normalize(listing.model);

        let score = 0;

        if (brandNorm && listingBrand === brandNorm) score += 40;
        if (modelNorm && listingModel && listingModel === modelNorm) score += 25;
        if (titleNorm && listingTitle === titleNorm) score += 25;

        if (tokens.length > 0) {
          const tokenMatches = tokens.filter((token) => listingTitle.includes(token)).length;
          score += Math.min(20, tokenMatches * 5);
        }

        if (data.category && listing.category === data.category) score += 10;
        if (data.year && listing.year) {
          if (listing.year === data.year) score += 10;
          else if (Math.abs(listing.year - data.year) <= 1) score += 5;
        }

        return { ...listing, score };
      })
      .filter((listing) => listing.score >= 20)
      .sort((a, b) => b.score - a.score || b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 6);

    return NextResponse.json({ duplicates: ranked });
  } catch (error) {
    console.error('Failed to check listing duplicates:', error);
    return apiError(500, 'Internal Server Error');
  }
}
