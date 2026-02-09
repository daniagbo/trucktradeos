import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { Prisma, SavedViewScope } from '@prisma/client';
import { apiError, apiValidationError } from '@/lib/api/errors';

const createSavedViewSchema = z.object({
  name: z.string().min(1).max(80),
  scope: z.enum(['LISTINGS', 'RFQS']),
  state: z.record(z.string(), z.unknown()),
}).strict();

function isAdmin(role: string | undefined) {
  return role === 'admin' || role === 'ADMIN';
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const { searchParams } = new URL(request.url);
    const scopeParam = searchParams.get('scope');
    const scope: SavedViewScope | undefined =
      scopeParam === 'LISTINGS' || scopeParam === 'RFQS'
        ? (scopeParam as SavedViewScope)
        : undefined;

    const where: Prisma.SavedViewWhereInput = {
      userId: session.userId,
      ...(scope ? { scope } : {}),
    };

    const views = await db.savedView.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ views });
  } catch (error) {
    console.error('Failed to fetch saved views:', error);
    return apiError(500, 'Internal Server Error');
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const body = await request.json();
    const validation = createSavedViewSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const view = await db.savedView.create({
      data: {
        name: validation.data.name,
        scope: validation.data.scope,
        // Zod validates the shape, Prisma requires JSON-compatible typing.
        state: validation.data.state as Prisma.InputJsonValue,
        userId: session.userId,
      },
    });

    return NextResponse.json({ success: true, view }, { status: 201 });
  } catch (error) {
    console.error('Failed to create saved view:', error);
    return apiError(500, 'Internal Server Error');
  }
}
