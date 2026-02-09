import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { Prisma } from '@prisma/client';
import { apiError, apiValidationError } from '@/lib/api/errors';

const createSchema = z
  .object({
    name: z.string().min(3).max(120),
    triggerType: z.enum(['SLA_ESCALATION']).default('SLA_ESCALATION'),
    actionType: z.enum(['NOTIFY_ADMIN']).default('NOTIFY_ADMIN'),
    condition: z
      .object({
        serviceTier: z.enum(['STANDARD', 'PRIORITY', 'ENTERPRISE']).optional(),
        escalationLevel: z.enum(['warning', 'critical']).optional(),
        minAgeHours: z.number().int().min(0).max(720).optional(),
      })
      .optional(),
    actionConfig: z
      .object({
        titlePrefix: z.string().max(80).optional(),
        messageSuffix: z.string().max(200).optional(),
      })
      .optional(),
    active: z.boolean().default(true),
  })
  .strict();

const updateSchema = createSchema
  .partial()
  .extend({
    id: z.string().min(1),
  })
  .strict();

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const orgId = await ensureUserOrganization(session.userId);
    if (!orgId) return NextResponse.json({ rules: [] });

    const rules = await db.automationRule.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return NextResponse.json({ rules });
  } catch (error) {
    console.error('Failed to load automation rules:', error);
    return apiError(500, 'Failed to load automation rules');
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const orgId = await ensureUserOrganization(session.userId);
    if (!orgId) return apiError(400, 'Organization not found');

    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const rule = await db.automationRule.create({
      data: {
        name: parsed.data.name,
        triggerType: parsed.data.triggerType,
        actionType: parsed.data.actionType,
        condition: (parsed.data.condition ?? {}) as Prisma.InputJsonValue,
        actionConfig: (parsed.data.actionConfig ?? {}) as Prisma.InputJsonValue,
        active: parsed.data.active,
        organizationId: orgId,
        createdById: session.userId,
      },
    });

    return NextResponse.json({ rule }, { status: 201 });
  } catch (error) {
    console.error('Failed to create automation rule:', error);
    return apiError(500, 'Failed to create automation rule');
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const orgId = await ensureUserOrganization(session.userId);
    if (!orgId) return apiError(400, 'Organization not found');

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const { id, ...rest } = parsed.data;

    const existing = await db.automationRule.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });
    if (!existing || existing.organizationId !== orgId) {
      return apiError(404, 'Rule not found');
    }

    const rule = await db.automationRule.update({
      where: { id },
      data: {
        ...(typeof rest.name === 'string' ? { name: rest.name } : {}),
        ...(typeof rest.triggerType === 'string' ? { triggerType: rest.triggerType } : {}),
        ...(typeof rest.actionType === 'string' ? { actionType: rest.actionType } : {}),
        ...(rest.condition ? { condition: rest.condition as Prisma.InputJsonValue } : {}),
        ...(rest.actionConfig ? { actionConfig: rest.actionConfig as Prisma.InputJsonValue } : {}),
        ...(typeof rest.active === 'boolean' ? { active: rest.active } : {}),
      },
    });

    return NextResponse.json({ rule });
  } catch (error) {
    console.error('Failed to update automation rule:', error);
    return apiError(500, 'Failed to update automation rule');
  }
}
