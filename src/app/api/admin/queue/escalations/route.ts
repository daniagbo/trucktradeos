import { NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/session';
import { db } from '@/lib/db';
import { createAdminNotification } from '@/lib/notifications';
import { ensureUserOrganization } from '@/lib/organization';
import { Prisma } from '@prisma/client';
import { apiError } from '@/lib/api/errors';

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

type EscalationItem = {
  rfqId: string;
  serviceTier: string;
  status: string;
  ageHours: number;
  slaTargetHours: number;
  escalationLevel: 'warning' | 'critical';
  hasOffer: boolean;
};

type TierPolicy = {
  serviceTier: string;
  warningThresholdRatio: number;
  criticalThresholdRatio: number;
};

type EscalationSummaryItem = {
  serviceTier: string;
  warningThresholdRatio: number;
  criticalThresholdRatio: number;
  warningCount: number;
  criticalCount: number;
};

type RuleCondition = {
  serviceTier?: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
  escalationLevel?: 'warning' | 'critical';
  minAgeHours?: number;
};

type RuleActionConfig = {
  titlePrefix?: string;
  messageSuffix?: string;
};

async function computeEscalations(organizationId?: string | null): Promise<EscalationItem[]> {
  const policies = await loadPolicies(organizationId);
  const policyByTier = new Map(policies.map((policy) => [policy.serviceTier, policy]));

  const rfqs = await db.rFQ.findMany({
    where: {
      status: { in: ['RECEIVED', 'REVIEWING', 'OFFER_SENT', 'PENDING_EXECUTION'] },
      ...(organizationId
        ? {
            user: {
              organizationId,
            },
          }
        : {}),
    },
    include: {
      offers: {
        where: { status: 'SENT' },
        select: { id: true },
      },
      user: {
        select: { organizationId: true },
      },
    },
    take: 300,
    orderBy: { createdAt: 'desc' },
  });

  const now = Date.now();
  return rfqs
    .map((rfq) => {
      const ageHours = (now - rfq.createdAt.getTime()) / (1000 * 60 * 60);
      const slaTargetHours = rfq.slaTargetHours || 72;
      const ratio = ageHours / Math.max(1, slaTargetHours);
      const policy = policyByTier.get(rfq.serviceTier);
      const warningRatio = policy?.warningThresholdRatio ?? 1;
      const criticalRatio = policy?.criticalThresholdRatio ?? 1.5;

      if (ratio < warningRatio) return null;

      return {
        rfqId: rfq.id,
        serviceTier: rfq.serviceTier,
        status: rfq.status,
        ageHours: Math.floor(ageHours),
        slaTargetHours,
        escalationLevel: ratio >= criticalRatio ? 'critical' : 'warning',
        hasOffer: rfq.offers.length > 0,
      } as EscalationItem;
    })
    .filter((item): item is EscalationItem => Boolean(item))
    .sort((a, b) => b.ageHours - a.ageHours)
    .slice(0, 20);
}

async function loadPolicies(organizationId?: string | null): Promise<TierPolicy[]> {
  if (!organizationId) return [];
  return db.approvalPolicy.findMany({
    where: { organizationId, active: true },
    select: {
      serviceTier: true,
      warningThresholdRatio: true,
      criticalThresholdRatio: true,
    },
  });
}

function buildSummary(items: EscalationItem[], policies: TierPolicy[]): EscalationSummaryItem[] {
  const policyByTier = new Map(policies.map((policy) => [policy.serviceTier, policy]));
  const tiers = Array.from(new Set(['STANDARD', 'PRIORITY', 'ENTERPRISE', ...items.map((item) => item.serviceTier)]));
  return tiers.map((tier) => {
    const warningCount = items.filter((item) => item.serviceTier === tier && item.escalationLevel === 'warning').length;
    const criticalCount = items.filter((item) => item.serviceTier === tier && item.escalationLevel === 'critical').length;
    const policy = policyByTier.get(tier);
    return {
      serviceTier: tier,
      warningThresholdRatio: policy?.warningThresholdRatio ?? 1,
      criticalThresholdRatio: policy?.criticalThresholdRatio ?? 1.5,
      warningCount,
      criticalCount,
    };
  });
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const orgId = await ensureUserOrganization(session.userId);
    const [items, policies] = await Promise.all([computeEscalations(orgId), loadPolicies(orgId)]);
    const summary = buildSummary(items, policies);
    return NextResponse.json({ items, summary });
  } catch (error) {
    console.error('Failed to fetch escalation queue:', error);
    return apiError(500, 'Failed to fetch escalation queue');
  }
}

export async function POST(request: Request) {
  let orgId: string | null = null;
  let sent = 0;
  let tasksCreated = 0;
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    orgId = await ensureUserOrganization(session.userId);
    const items = await computeEscalations(orgId);
    const dayStamp = new Date().toISOString().slice(0, 10);
    const rules =
      orgId
        ? await db.automationRule.findMany({
            where: {
              organizationId: orgId,
              triggerType: 'SLA_ESCALATION',
              active: true,
            },
          })
        : [];

    const runRuleNotifications = rules.length > 0;
    for (const item of items.slice(0, 20)) {
      if (orgId) {
        const source = `sla_escalation:${item.escalationLevel}`;
        const existingTask = await db.opsTask.findFirst({
          where: {
            organizationId: orgId,
            rfqId: item.rfqId,
            source,
            status: { in: ['OPEN', 'ACKNOWLEDGED'] },
          },
          select: { id: true },
        });
        if (!existingTask) {
          await db.opsTask.create({
            data: {
              organizationId: orgId,
              rfqId: item.rfqId,
              source,
              title:
                item.escalationLevel === 'critical'
                  ? 'Critical SLA breach requires action'
                  : 'SLA warning requires follow-up',
              details: `RFQ ${item.rfqId.slice(0, 12)} is ${item.ageHours}h old vs ${item.slaTargetHours}h target (${item.serviceTier}).`,
              priority: item.escalationLevel === 'critical' ? 'CRITICAL' : 'HIGH',
              dueAt: new Date(Date.now() + (item.escalationLevel === 'critical' ? 60 : 240) * 60 * 1000),
            },
          });
          tasksCreated += 1;
        }
      }

      if (!runRuleNotifications) {
        const title =
          item.escalationLevel === 'critical'
            ? 'Critical SLA escalation'
            : 'SLA escalation warning';
        const message = `RFQ ${item.rfqId.slice(0, 10)} is ${item.ageHours}h old (target ${item.slaTargetHours}h).`;
        await createAdminNotification({
          type: 'SLA',
          title,
          message,
          metadata: {
            rfqId: item.rfqId,
            ageHours: item.ageHours,
            targetHours: item.slaTargetHours,
            level: item.escalationLevel,
            tier: item.serviceTier,
            source: 'default-escalation',
          },
          dedupeKey: `escalation:${dayStamp}:${item.rfqId}:${item.escalationLevel}`,
        });
        sent += 1;
        continue;
      }

      for (const rule of rules) {
        const condition = (rule.condition || {}) as RuleCondition;
        const actionConfig = (rule.actionConfig || {}) as RuleActionConfig;

        if (condition.serviceTier && condition.serviceTier !== item.serviceTier) continue;
        if (condition.escalationLevel && condition.escalationLevel !== item.escalationLevel) continue;
        if (typeof condition.minAgeHours === 'number' && item.ageHours < condition.minAgeHours) continue;

        const baseTitle =
          item.escalationLevel === 'critical'
            ? 'Critical SLA escalation'
            : 'SLA escalation warning';
        const title = `${actionConfig.titlePrefix ? `${actionConfig.titlePrefix} ` : ''}${baseTitle}`.trim();
        const message = `RFQ ${item.rfqId.slice(0, 10)} is ${item.ageHours}h old (target ${item.slaTargetHours}h).${actionConfig.messageSuffix ? ` ${actionConfig.messageSuffix}` : ''}`;
        await createAdminNotification({
          type: 'SLA',
          title,
          message,
          metadata: {
            rfqId: item.rfqId,
            ageHours: item.ageHours,
            targetHours: item.slaTargetHours,
            level: item.escalationLevel,
            tier: item.serviceTier,
            source: 'automation-rule',
            ruleId: rule.id,
            ruleName: rule.name,
          },
          dedupeKey: `escalation:${dayStamp}:${rule.id}:${item.rfqId}:${item.escalationLevel}`,
        });
        sent += 1;
      }
    }

    if (rules.length > 0) {
      await db.automationRule.updateMany({
        where: { id: { in: rules.map((r) => r.id) } },
        data: { lastRunAt: new Date() },
      });
    }

    if (orgId) {
      await db.automationRunLog.create({
        data: {
          organizationId: orgId,
          triggerType: 'SLA_ESCALATION',
          source: 'queue/escalations',
          status: 'SUCCESS',
          notifications: sent,
          tasksCreated,
          dedupedCount: 0,
          metadata: {
            matchedItems: items.length,
            activeRules: rules.length,
          } as Prisma.InputJsonValue,
        },
      });
    }

    return NextResponse.json({ success: true, sent, tasksCreated });
  } catch (error) {
    console.error('Failed to run escalation notifications:', error);
    if (orgId) {
      await db.automationRunLog.create({
        data: {
          organizationId: orgId,
          triggerType: 'SLA_ESCALATION',
          source: 'queue/escalations',
          status: 'FAILED',
          notifications: sent,
          tasksCreated,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(() => {});
    }
    return apiError(500, 'Failed to run escalation notifications');
  }
}
