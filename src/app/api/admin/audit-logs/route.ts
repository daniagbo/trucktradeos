import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { z } from 'zod';
import { apiError } from '@/lib/api/errors';

const querySchema = z.object({
  entityId: z.string().min(1),
  scope: z.enum(['listing', 'rfq']).default('listing'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

function isAdmin(role: string | undefined) {
  return role === 'admin' || role === 'ADMIN';
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const { searchParams } = new URL(request.url);
    const validation = querySchema.safeParse({
      entityId: searchParams.get('entityId'),
      scope: searchParams.get('scope') || 'listing',
      limit: searchParams.get('limit') || '20',
    });

    if (!validation.success) {
      return apiError(400, 'Invalid query');
    }

    const { entityId, scope, limit } = validation.data;
    const actionPrefixes = scope === 'rfq' ? ['rfq.', 'offer.'] : ['listing.'];

    const logs = await db.auditLog.findMany({
      where: {
        entityId,
        OR: actionPrefixes.map((prefix) => ({
          action: {
            startsWith: prefix,
          },
        })),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return apiError(500, 'Internal Server Error');
  }
}
