import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { apiError } from '@/lib/api/errors';

const querySchema = z.object({
  serviceTier: z.enum(['STANDARD', 'PRIORITY', 'ENTERPRISE']),
  warningThresholdRatio: z.coerce.number().min(0.5).max(3).optional(),
  criticalThresholdRatio: z.coerce.number().min(1).max(4).optional(),
});

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const orgId = await ensureUserOrganization(session.userId);
    if (!orgId) {
      return apiError(400, 'Organization not found');
    }

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      serviceTier: url.searchParams.get('serviceTier') ?? undefined,
      warningThresholdRatio: url.searchParams.get('warningThresholdRatio') ?? undefined,
      criticalThresholdRatio: url.searchParams.get('criticalThresholdRatio') ?? undefined,
    });
    if (!parsed.success) {
      return apiError(400, 'Invalid query params');
    }

    const query = parsed.data;

    const policy = await db.approvalPolicy.findFirst({
      where: {
        organizationId: orgId,
        serviceTier: query.serviceTier,
        active: true,
      },
      orderBy: { updatedAt: 'desc' },
      select: { warningThresholdRatio: true, criticalThresholdRatio: true },
    });

    const warningRatio = query.warningThresholdRatio ?? policy?.warningThresholdRatio ?? 1;
    const criticalRatio = query.criticalThresholdRatio ?? policy?.criticalThresholdRatio ?? 1.5;

    const rfqs = await db.rFQ.findMany({
      where: {
        serviceTier: query.serviceTier,
        status: { in: ['RECEIVED', 'REVIEWING', 'OFFER_SENT', 'PENDING_EXECUTION'] },
        user: { organizationId: orgId },
      },
      select: {
        id: true,
        createdAt: true,
        slaTargetHours: true,
      },
      take: 500,
      orderBy: { createdAt: 'desc' },
    });

    const now = Date.now();
    let warningCount = 0;
    let criticalCount = 0;

    for (const rfq of rfqs) {
      const ageHours = (now - rfq.createdAt.getTime()) / (1000 * 60 * 60);
      const targetHours = Math.max(1, rfq.slaTargetHours || 72);
      const ratio = ageHours / targetHours;
      if (ratio >= warningRatio) warningCount += 1;
      if (ratio >= criticalRatio) criticalCount += 1;
    }

    return NextResponse.json({
      serviceTier: query.serviceTier,
      warningThresholdRatio: warningRatio,
      criticalThresholdRatio: criticalRatio,
      totalActiveRfqs: rfqs.length,
      warningCount,
      criticalCount,
    });
  } catch (error) {
    console.error('Failed to compute policy impact:', error);
    return apiError(500, 'Failed to compute policy impact');
  }
}
