import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { apiError } from '@/lib/api/errors';

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

type PayloadProjection = {
  servicePackage?: 'Core' | 'Concierge' | 'Command';
  packageAddons?: string[];
};

const packageWeight: Record<'Core' | 'Concierge' | 'Command', number> = {
  Core: 1,
  Concierge: 3,
  Command: 6,
};

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const organizationId = await ensureUserOrganization(session.userId);
    if (!organizationId) {
      return NextResponse.json({ summary: null, packageMix: [], addonMix: [], upsellCandidates: [] });
    }

    const rfqs = await db.rFQ.findMany({
      where: { user: { organizationId } },
      include: {
        events: {
          select: { type: true, payload: true, timestamp: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 800,
    });

    const normalized = rfqs.map((rfq) => {
      const payloadEvents = rfq.events
        .filter((event) => event.type === 'rfq_payload')
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const payloadEvent = [...payloadEvents].reverse()[0];
      const initialPayloadEvent = payloadEvents[0];
      const initialPayload = (initialPayloadEvent?.payload || {}) as PayloadProjection;
      const initialServicePackage = initialPayload.servicePackage || 'Core';
      const payload = (payloadEvent?.payload || {}) as PayloadProjection;
      const servicePackage = payload.servicePackage || 'Core';
      const packageAddons = Array.isArray(payload.packageAddons)
        ? payload.packageAddons.filter((item): item is string => typeof item === 'string')
        : [];
      return {
        id: rfq.id,
        status: rfq.status,
        initialServicePackage,
        servicePackage,
        packageAddons,
      };
    });

    const upgrades = normalized.filter(
      (rfq) =>
        (rfq.initialServicePackage === 'Core' && rfq.servicePackage !== 'Core') ||
        (rfq.initialServicePackage === 'Concierge' && rfq.servicePackage === 'Command')
    );
    const downgradeCount = normalized.filter(
      (rfq) =>
        (rfq.initialServicePackage === 'Command' && rfq.servicePackage !== 'Command') ||
        (rfq.initialServicePackage === 'Concierge' && rfq.servicePackage === 'Core')
    ).length;

    const conversionByTier = ['STANDARD', 'PRIORITY', 'ENTERPRISE'].map((tier) => {
      const scoped = normalized.filter((rfq) => {
        const model = rfqs.find((item) => item.id === rfq.id);
        return model?.serviceTier === tier;
      });
      const scopedUpgrades = scoped.filter(
        (rfq) =>
          (rfq.initialServicePackage === 'Core' && rfq.servicePackage !== 'Core') ||
          (rfq.initialServicePackage === 'Concierge' && rfq.servicePackage === 'Command')
      ).length;
      return {
        tier,
        total: scoped.length,
        upgrades: scopedUpgrades,
        upgradeRate: scoped.length > 0 ? Math.round((scopedUpgrades / scoped.length) * 100) : 0,
      };
    });

    const packageMix = (['Core', 'Concierge', 'Command'] as const).map((pkg) => {
      const count = normalized.filter((rfq) => rfq.servicePackage === pkg).length;
      return { package: pkg, count };
    });

    const addonCounts = new Map<string, number>();
    for (const rfq of normalized) {
      for (const addon of rfq.packageAddons) {
        addonCounts.set(addon, (addonCounts.get(addon) || 0) + 1);
      }
    }
    const addonMix = Array.from(addonCounts.entries())
      .map(([addon, count]) => ({ addon, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const upsellCandidates = normalized
      .filter((rfq) => rfq.servicePackage === 'Core' && ['RECEIVED', 'REVIEWING', 'OFFER_SENT'].includes(rfq.status))
      .map((rfq) => ({
        rfqId: rfq.id,
        reason:
          rfq.packageAddons.length === 0
            ? 'No add-ons attached'
            : 'Core package with partial add-ons',
      }))
      .slice(0, 12);

    const weightedPipelineValue = normalized.reduce(
      (sum, rfq) => sum + packageWeight[rfq.servicePackage],
      0
    );

    return NextResponse.json({
      summary: {
        totalRfqs: normalized.length,
        weightedPipelineValue,
        coreShare:
          normalized.length > 0
            ? Math.round((normalized.filter((rfq) => rfq.servicePackage === 'Core').length / normalized.length) * 100)
            : 0,
        upgrades: upgrades.length,
        downgradeCount,
        upgradeRate: normalized.length > 0 ? Math.round((upgrades.length / normalized.length) * 100) : 0,
      },
      conversionByTier,
      packageMix,
      addonMix,
      upsellCandidates,
    });
  } catch (error) {
    console.error('Failed to compute revenue opportunities:', error);
    return apiError(500, 'Failed to compute revenue opportunities');
  }
}
