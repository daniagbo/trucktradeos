import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { z } from 'zod';
import { apiError, apiValidationError } from '@/lib/api/errors';

const entitySchema = z.enum(['LISTING', 'RFQ']);

const createSchema = z.object({
  entityType: entitySchema,
  entityId: z.string().min(1),
}).strict();

function isAdmin(role: string | undefined) {
  return role === 'admin' || role === 'ADMIN';
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return NextResponse.json({ items: [] });
    }

    const { searchParams } = new URL(request.url);
    const typeRaw = searchParams.get('entityType');
    const type = typeRaw ? entitySchema.safeParse(typeRaw).data : undefined;

    const items = await db.watchlistItem.findMany({
      where: {
        userId: session.userId,
        entityType: type || undefined,
      },
      orderBy: { pinnedAt: 'desc' },
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Failed to fetch watchlist:', error);
    return apiError(500, 'Internal Server Error');
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const item = await db.watchlistItem.upsert({
      where: {
        userId_entityType_entityId: {
          userId: session.userId,
          entityType: validation.data.entityType,
          entityId: validation.data.entityId,
        },
      },
      update: { pinnedAt: new Date() },
      create: {
        userId: session.userId,
        entityType: validation.data.entityType,
        entityId: validation.data.entityId,
      },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error('Failed to pin watchlist item:', error);
    return apiError(500, 'Internal Server Error');
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    await db.watchlistItem.deleteMany({
      where: {
        userId: session.userId,
        entityType: validation.data.entityType,
        entityId: validation.data.entityId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to unpin watchlist item:', error);
    return apiError(500, 'Internal Server Error');
  }
}
