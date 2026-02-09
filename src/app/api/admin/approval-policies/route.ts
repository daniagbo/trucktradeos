import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { apiError, apiValidationError } from '@/lib/api/errors';

const policySchema = z
  .object({
    serviceTier: z.enum(['STANDARD', 'PRIORITY', 'ENTERPRISE']),
    requiredApprovals: z.number().int().min(1).max(5),
    approverTeamRole: z.enum(['APPROVER', 'MANAGER', 'OWNER']).default('APPROVER'),
    autoAssignEnabled: z.boolean().default(true),
    warningThresholdRatio: z.number().min(0.5).max(3).default(1),
    criticalThresholdRatio: z.number().min(1).max(4).default(1.5),
    active: z.boolean().default(true),
  })
  .strict()
  .refine((data) => data.criticalThresholdRatio >= data.warningThresholdRatio, {
    message: 'Critical threshold must be greater than or equal to warning threshold',
    path: ['criticalThresholdRatio'],
  });

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    let currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });

    if (!currentUser?.organizationId) {
      const ensuredOrgId = await ensureUserOrganization(session.userId);
      currentUser = { organizationId: ensuredOrgId };
    }

    if (!currentUser?.organizationId) {
      return NextResponse.json({ organization: null, members: [], policies: [] });
    }

    const [organization, members, policies] = await Promise.all([
      db.organization.findUnique({
        where: { id: currentUser.organizationId },
        select: { id: true, name: true, slug: true },
      }),
      db.user.findMany({
        where: { organizationId: currentUser.organizationId },
        select: { id: true, name: true, email: true, role: true, teamRole: true },
        orderBy: [{ teamRole: 'asc' }, { name: 'asc' }],
      }),
      db.approvalPolicy.findMany({
        where: { organizationId: currentUser.organizationId },
        orderBy: { serviceTier: 'asc' },
      }),
    ]);

    return NextResponse.json({ organization, members, policies });
  } catch (error) {
    console.error('Failed to get approval policies:', error);
    return apiError(500, 'Failed to get approval policies');
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    let currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });
    if (!currentUser?.organizationId) {
      const ensuredOrgId = await ensureUserOrganization(session.userId);
      currentUser = { organizationId: ensuredOrgId };
    }
    if (!currentUser?.organizationId) {
      return apiError(400, 'Current user has no organization');
    }

    const body = await request.json();
    const parsed = policySchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const data = parsed.data;
    const policy = await db.approvalPolicy.upsert({
      where: {
        organizationId_serviceTier: {
          organizationId: currentUser.organizationId,
          serviceTier: data.serviceTier,
        },
      },
      create: {
        organizationId: currentUser.organizationId,
        serviceTier: data.serviceTier,
        requiredApprovals: data.requiredApprovals,
        approverTeamRole: data.approverTeamRole,
        autoAssignEnabled: data.autoAssignEnabled,
        warningThresholdRatio: data.warningThresholdRatio,
        criticalThresholdRatio: data.criticalThresholdRatio,
        active: data.active,
        createdById: session.userId,
      },
      update: {
        requiredApprovals: data.requiredApprovals,
        approverTeamRole: data.approverTeamRole,
        autoAssignEnabled: data.autoAssignEnabled,
        warningThresholdRatio: data.warningThresholdRatio,
        criticalThresholdRatio: data.criticalThresholdRatio,
        active: data.active,
        createdById: session.userId,
      },
    });

    return NextResponse.json({ policy }, { status: 201 });
  } catch (error) {
    console.error('Failed to save approval policy:', error);
    return apiError(500, 'Failed to save approval policy');
  }
}
