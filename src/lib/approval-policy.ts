import type { ServiceTier, TeamRole } from '@prisma/client';
import { db } from '@/lib/db';
import { ensureUserOrganization } from '@/lib/organization';

type ResolvedApprovalPolicy = {
  organizationId: string | null;
  policyId: string | null;
  requiredApprovals: number;
  approverIds: string[];
  primaryApproverId: string | null;
  policySource: 'organization' | 'default';
};

function defaultApprovalsForTier(serviceTier: ServiceTier): number {
  if (serviceTier === 'ENTERPRISE') return 2;
  if (serviceTier === 'PRIORITY') return 1;
  return 1;
}

function fallbackTeamRoles(role: TeamRole): TeamRole[] {
  if (role === 'APPROVER') return ['APPROVER', 'MANAGER', 'OWNER'];
  if (role === 'MANAGER') return ['MANAGER', 'OWNER'];
  if (role === 'OWNER') return ['OWNER'];
  return ['APPROVER', 'MANAGER', 'OWNER'];
}

export async function resolveApprovalRouting(input: {
  requesterId: string;
  serviceTier: ServiceTier;
  requiredApprovalsOverride?: number;
}): Promise<ResolvedApprovalPolicy> {
  const requester = await db.user.findUnique({
    where: { id: input.requesterId },
    select: { organizationId: true },
  });

  let orgId = requester?.organizationId ?? null;
  if (!orgId) {
    orgId = await ensureUserOrganization(input.requesterId);
  }
  let requiredApprovals =
    input.requiredApprovalsOverride ?? defaultApprovalsForTier(input.serviceTier);
  let approverIds: string[] = [];
  let policyId: string | null = null;
  let policySource: 'organization' | 'default' = 'default';

  if (orgId) {
    const policy = await db.approvalPolicy.findFirst({
      where: {
        organizationId: orgId,
        serviceTier: input.serviceTier,
        active: true,
      },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        requiredApprovals: true,
        approverTeamRole: true,
        autoAssignEnabled: true,
      },
    });

    if (policy) {
      policyId = policy.id;
      policySource = 'organization';
      if (input.requiredApprovalsOverride == null) {
        requiredApprovals = policy.requiredApprovals;
      }

      if (policy.autoAssignEnabled) {
        const orgApprovers = await db.user.findMany({
          where: {
            organizationId: orgId,
            id: { not: input.requesterId },
            teamRole: { in: fallbackTeamRoles(policy.approverTeamRole) },
          },
          orderBy: [{ teamRole: 'asc' }, { createdAt: 'asc' }],
          select: { id: true },
          take: 20,
        });
        approverIds = orgApprovers.map((user) => user.id);
      }
    }
  }

  if (approverIds.length === 0) {
    const admins = await db.user.findMany({
      where: { role: 'ADMIN', id: { not: input.requesterId } },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
      take: 20,
    });
    approverIds = admins.map((user) => user.id);
  }

  if (requiredApprovals < 1) requiredApprovals = 1;
  if (approverIds.length > 0 && requiredApprovals > approverIds.length) {
    requiredApprovals = approverIds.length;
  }

  return {
    organizationId: orgId,
    policyId,
    requiredApprovals,
    approverIds,
    primaryApproverId: approverIds[0] ?? null,
    policySource,
  };
}
