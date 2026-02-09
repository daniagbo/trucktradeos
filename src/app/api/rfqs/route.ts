import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { mapMessageModel, mapOfferModel, mapRfqModel, toDbRfqStatus } from '@/lib/rfq-api';
import type { RFQ } from '@/lib/types';
import { createAdminNotification } from '@/lib/notifications';
import { ensureUserOrganization } from '@/lib/organization';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { apiError, apiValidationError } from '@/lib/api/errors';

function computeMandateCompleteness(input: {
  keySpecs?: string;
  deliveryCountry?: string;
  conditionTolerance?: string;
  businessGoal?: string;
  riskTolerance?: string;
  budgetConfidence?: string;
}) {
  const checks = [
    Boolean(input.keySpecs && input.keySpecs.trim().length >= 10),
    Boolean(input.deliveryCountry && input.deliveryCountry.trim().length >= 2),
    Boolean(input.conditionTolerance && input.conditionTolerance.trim().length >= 3),
    Boolean(input.businessGoal && input.businessGoal.trim().length >= 5),
    Boolean(input.riskTolerance),
    Boolean(input.budgetConfidence),
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ rfqs: [], offers: [], messages: [] });
    }

    const isAdmin = session.role === 'ADMIN' || session.role === 'admin';
    const rfqModels = await db.rFQ.findMany({
      where: isAdmin ? {} : { userId: session.userId },
      include: {
        offers: { orderBy: { createdAt: 'desc' } },
        messages: { orderBy: { createdAt: 'asc' } },
        events: { orderBy: { timestamp: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const rfqs = rfqModels.map(mapRfqModel);
    const offers = rfqModels.flatMap((rfq: (typeof rfqModels)[number]) => rfq.offers.map(mapOfferModel));
    const messages = rfqModels.flatMap((rfq: (typeof rfqModels)[number]) => rfq.messages.map(mapMessageModel));
    return NextResponse.json({ rfqs, offers, messages });
  } catch (error) {
    console.error('Failed to fetch RFQs:', error);
    return apiError(500, 'Failed to fetch RFQs');
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const createRfqSchema = z.object({
      listingId: z.string().optional().nullable(),
      category: z.enum(['Trailer', 'Truck', 'Heavy Equipment']).default('Truck'),
      keySpecs: z.string().trim().min(10),
      preferredBrands: z.string().trim().optional(),
      yearMin: z.number().int().optional(),
      yearMax: z.number().int().optional(),
      budgetMin: z.number().optional(),
      budgetMax: z.number().optional(),
      deliveryCountry: z.string().trim().min(2),
      pickupDeadline: z.union([z.string().datetime(), z.date()]).optional(),
      urgency: z.enum(['Normal', 'Urgent']).default('Normal'),
      serviceTier: z.enum(['Standard', 'Priority', 'Enterprise']).default('Standard'),
      servicePackage: z.enum(['Core', 'Concierge', 'Command']).default('Core'),
      packageAddons: z.array(z.enum(['Verification', 'Logistics', 'Financing', 'Compliance', 'DedicatedManager'])).default([]),
      requiredDocuments: z.array(z.string()).default([]),
      conditionTolerance: z.string().trim().min(3),
      notes: z.string().trim().optional(),
      businessGoal: z.string().trim().optional(),
      riskTolerance: z.enum(['Low', 'Medium', 'High']).optional(),
      budgetConfidence: z.enum(['Fixed', 'Flexible', 'Exploratory']).optional(),
    }).strict();

    const bodyJson = await request.json();
    const validation = createRfqSchema.safeParse(bodyJson);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const body = validation.data as Omit<RFQ, 'id' | 'createdAt' | 'status' | 'events'>;
    const category = body.category || 'Truck';
    const urgency = body.urgency || 'Normal';
    const serviceTier = body.serviceTier || 'Standard';
    const slaTargetHours =
      serviceTier === 'Enterprise' ? 8 : serviceTier === 'Priority' ? 24 : 72;
    const mandateCompleteness = computeMandateCompleteness({
      keySpecs: body.keySpecs,
      deliveryCountry: body.deliveryCountry,
      conditionTolerance: body.conditionTolerance,
      businessGoal: body.businessGoal,
      riskTolerance: body.riskTolerance,
      budgetConfidence: body.budgetConfidence,
    });

    const created = await db.rFQ.create({
      data: {
        userId: session.userId,
        listingId: body.listingId || null,
        serviceTier: serviceTier.toUpperCase() as 'STANDARD' | 'PRIORITY' | 'ENTERPRISE',
        slaTargetHours,
        category,
        brand: body.preferredBrands,
        requirements: body.keySpecs,
        budget: body.deliveryCountry,
        urgency,
        status: toDbRfqStatus('Received'),
        deliverables: {
          create: [
            {
              type: 'SOURCING_BRIEF',
              title: 'Sourcing brief',
              summary: 'Compile requirement summary and sourcing hypothesis.',
              dueAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
            },
            {
              type: 'SUPPLIER_SHORTLIST',
              title: 'Supplier shortlist',
              summary: 'Provide shortlist aligned with mandate constraints.',
              dueAt: new Date(Date.now() + 1000 * 60 * 60 * slaTargetHours),
            },
          ],
        },
        events: {
          create: [
            {
              type: 'status_change',
              payload: { status: 'Received' } as Prisma.InputJsonValue,
            },
            {
              type: 'rfq_payload',
              payload: {
                keySpecs: body.keySpecs,
                yearMin: body.yearMin,
                yearMax: body.yearMax,
                budgetMin: body.budgetMin,
                budgetMax: body.budgetMax,
                pickupDeadline: body.pickupDeadline ? new Date(body.pickupDeadline).toISOString() : null,
                requiredDocuments: body.requiredDocuments || [],
                conditionTolerance: body.conditionTolerance,
                notes: body.notes,
                businessGoal: body.businessGoal,
                riskTolerance: body.riskTolerance,
                budgetConfidence: body.budgetConfidence,
                mandateCompleteness,
                servicePackage: body.servicePackage || 'Core',
                packageAddons: body.packageAddons || [],
                serviceTier,
                slaTargetHours,
              } as Prisma.InputJsonValue,
            },
          ],
        },
      },
      include: {
        offers: true,
        messages: true,
        events: { orderBy: { timestamp: 'asc' } },
      },
    });

    await createAdminNotification({
      type: 'RFQ',
      title: 'New RFQ received',
      message: `RFQ ${created.id.slice(0, 10)} submitted by user ${session.userId.slice(0, 8)} (${serviceTier}).`,
      metadata: {
        rfqId: created.id,
        urgency,
        serviceTier,
        servicePackage: body.servicePackage || 'Core',
        packageAddons: body.packageAddons || [],
        slaTargetHours,
      },
    });

    // Auto-create a conversion follow-up task for high-potential Core-package requests.
    const packageName = body.servicePackage || 'Core';
    if (
      packageName === 'Core' &&
      ['Priority', 'Enterprise'].includes(serviceTier) &&
      mandateCompleteness >= 80
    ) {
      const organizationId = await ensureUserOrganization(session.userId);
      if (organizationId) {
        await db.opsTask.create({
          data: {
            organizationId,
            rfqId: created.id,
            title: 'Upsell review for high-potential Core RFQ',
            details: `RFQ ${created.id.slice(0, 12)} is ${serviceTier} with ${mandateCompleteness}% mandate completeness. Consider package upgrade outreach.`,
            source: 'auto_upsell_core',
            priority: serviceTier === 'Enterprise' ? 'CRITICAL' : 'HIGH',
            dueAt: new Date(Date.now() + 1000 * 60 * 60 * 6),
          },
        });
      }
    }

    return NextResponse.json({ rfq: mapRfqModel(created) });
  } catch (error) {
    console.error('Failed to create RFQ:', error);
    return apiError(500, 'Failed to create RFQ');
  }
}
