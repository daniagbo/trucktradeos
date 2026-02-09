import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { apiError } from '@/lib/api/errors';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  triggerType: z.string().min(1).optional(),
});

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const organizationId = await ensureUserOrganization(session.userId);
    if (!organizationId) {
      return NextResponse.json({ runs: [] });
    }

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) {
      return apiError(400, 'Invalid query');
    }

    const runs = await db.automationRunLog.findMany({
      where: {
        organizationId,
        ...(parsed.data.triggerType ? { triggerType: parsed.data.triggerType } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: parsed.data.limit,
    });

    return NextResponse.json({ runs });
  } catch (error) {
    console.error('Failed to fetch automation runs:', error);
    return apiError(500, 'Failed to fetch automation runs');
  }
}
