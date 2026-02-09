import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { apiError, apiValidationError } from '@/lib/api/errors';

const querySchema = z.object({
  status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  rfqId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

const createSchema = z
  .object({
    title: z.string().min(3).max(180),
    details: z.string().max(5000).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
    source: z.string().min(2).max(80).default('manual'),
    rfqId: z.string().min(1).optional(),
    assigneeId: z.string().min(1).optional(),
    dueAt: z.string().datetime().optional(),
  })
  .strict();

const patchSchema = z
  .object({
    id: z.string().min(1),
    title: z.string().min(3).max(180).optional(),
    details: z.string().max(5000).optional(),
    status: z.enum(['OPEN', 'ACKNOWLEDGED', 'RESOLVED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    assigneeId: z.string().min(1).nullable().optional(),
    dueAt: z.string().datetime().nullable().optional(),
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

    const organizationId = await ensureUserOrganization(session.userId);
    if (!organizationId) {
      return NextResponse.json({ tasks: [] });
    }

    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      status: searchParams.get('status') || undefined,
      priority: searchParams.get('priority') || undefined,
      rfqId: searchParams.get('rfqId') || undefined,
      limit: searchParams.get('limit') || '50',
    });
    if (!parsed.success) {
      return apiError(400, 'Invalid query');
    }

    const where = {
      organizationId,
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
      ...(parsed.data.rfqId ? { rfqId: parsed.data.rfqId } : {}),
    };

    const tasks = await db.opsTask.findMany({
      where,
      include: {
        assignee: {
          select: { id: true, name: true, email: true, teamRole: true },
        },
        rfq: {
          select: { id: true, status: true, serviceTier: true, createdAt: true },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      take: parsed.data.limit,
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Failed to fetch ops tasks:', error);
    return apiError(500, 'Failed to fetch ops tasks');
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const organizationId = await ensureUserOrganization(session.userId);
    if (!organizationId) {
      return apiError(400, 'No organization configured');
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const input = parsed.data;

    if (input.assigneeId) {
      const assignee = await db.user.findUnique({
        where: { id: input.assigneeId },
        select: { id: true, organizationId: true },
      });
      if (!assignee || assignee.organizationId !== organizationId) {
        return apiError(400, 'Invalid assignee');
      }
    }

    if (input.rfqId) {
      const rfq = await db.rFQ.findUnique({
        where: { id: input.rfqId },
        select: { id: true, user: { select: { organizationId: true } } },
      });
      if (!rfq || rfq.user.organizationId !== organizationId) {
        return apiError(400, 'Invalid RFQ scope');
      }
    }

    const task = await db.opsTask.create({
      data: {
        organizationId,
        title: input.title,
        details: input.details || null,
        priority: input.priority,
        source: input.source,
        rfqId: input.rfqId || null,
        assigneeId: input.assigneeId || null,
        dueAt: input.dueAt ? new Date(input.dueAt) : null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, teamRole: true },
        },
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Failed to create ops task:', error);
    return apiError(500, 'Failed to create ops task');
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const organizationId = await ensureUserOrganization(session.userId);
    if (!organizationId) {
      return apiError(400, 'No organization configured');
    }

    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }
    const input = parsed.data;

    const existing = await db.opsTask.findUnique({
      where: { id: input.id },
      select: { id: true, organizationId: true },
    });
    if (!existing || existing.organizationId !== organizationId) {
      return apiError(404, 'Task not found');
    }

    if (typeof input.assigneeId === 'string') {
      const assignee = await db.user.findUnique({
        where: { id: input.assigneeId },
        select: { id: true, organizationId: true },
      });
      if (!assignee || assignee.organizationId !== organizationId) {
        return apiError(400, 'Invalid assignee');
      }
    }

    const task = await db.opsTask.update({
      where: { id: input.id },
      data: {
        ...(typeof input.title === 'string' ? { title: input.title } : {}),
        ...(typeof input.details === 'string' ? { details: input.details } : {}),
        ...(input.priority ? { priority: input.priority } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.status === 'RESOLVED' ? { resolvedAt: new Date() } : {}),
        ...(input.status && input.status !== 'RESOLVED' ? { resolvedAt: null } : {}),
        ...(input.assigneeId !== undefined ? { assigneeId: input.assigneeId } : {}),
        ...(input.dueAt !== undefined
          ? {
              dueAt: input.dueAt ? new Date(input.dueAt) : null,
            }
          : {}),
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true, teamRole: true },
        },
      },
    });

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Failed to update ops task:', error);
    return apiError(500, 'Failed to update ops task');
  }
}
