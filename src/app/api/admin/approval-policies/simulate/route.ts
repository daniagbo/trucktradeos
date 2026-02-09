import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { apiError } from '@/lib/api/errors';

const querySchema = z.object({
  serviceTier: z.enum(['STANDARD', 'PRIORITY', 'ENTERPRISE']),
  warningThresholdRatio: z.coerce.number().min(0.5).max(3),
  criticalThresholdRatio: z.coerce.number().min(1).max(4),
});

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const parsed = querySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams.entries()));
    if (!parsed.success) {
      return apiError(400, 'Invalid query');
    }

    const organizationId = await ensureUserOrganization(session.userId);
    if (!organizationId) {
      return apiError(400, 'No organization configured');
    }

    const { serviceTier, warningThresholdRatio, criticalThresholdRatio } = parsed.data;

    const [policy, rfqs] = await Promise.all([
      db.approvalPolicy.findUnique({
        where: {
          organizationId_serviceTier: {
            organizationId,
            serviceTier,
          },
        },
      }),
      db.rFQ.findMany({
        where: {
          user: { organizationId },
          serviceTier,
          status: { in: ['RECEIVED', 'REVIEWING', 'OFFER_SENT', 'PENDING_EXECUTION'] },
        },
        select: {
          id: true,
          createdAt: true,
          slaTargetHours: true,
        },
        take: 500,
      }),
    ]);

    const now = Date.now();
    const baselineWarning = policy?.warningThresholdRatio ?? 1;
    const baselineCritical = policy?.criticalThresholdRatio ?? 1.5;

    const computeCounts = (warning: number, critical: number) => {
      let warningCount = 0;
      let criticalCount = 0;
      for (const rfq of rfqs) {
        const ageHours = (now - rfq.createdAt.getTime()) / (1000 * 60 * 60);
        const ratio = ageHours / Math.max(1, rfq.slaTargetHours || 72);
        if (ratio >= warning) warningCount += 1;
        if (ratio >= critical) criticalCount += 1;
      }
      return { warningCount, criticalCount };
    };

    const baseline = computeCounts(baselineWarning, baselineCritical);
    const proposed = computeCounts(warningThresholdRatio, criticalThresholdRatio);

    return NextResponse.json({
      serviceTier,
      sampleSize: rfqs.length,
      current: {
        warningThresholdRatio: baselineWarning,
        criticalThresholdRatio: baselineCritical,
        ...baseline,
      },
      proposed: {
        warningThresholdRatio,
        criticalThresholdRatio,
        ...proposed,
      },
      delta: {
        warningCount: proposed.warningCount - baseline.warningCount,
        criticalCount: proposed.criticalCount - baseline.criticalCount,
      },
    });
  } catch (error) {
    console.error('Failed to simulate policy impact:', error);
    return apiError(500, 'Failed to simulate policy impact');
  }
}
