import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { apiError, apiValidationError } from '@/lib/api/errors';

const createSchema = z
  .object({
    type: z.enum([
      'SOURCING_BRIEF',
      'SUPPLIER_SHORTLIST',
      'NEGOTIATION_NOTE',
      'CLOSE_MEMO',
      'BENCHMARK_REPORT',
      'SUPPLIER_COMPARISON',
    ]),
    title: z.string().min(3).max(140),
    summary: z.string().max(4000).optional(),
    dueAt: z.string().datetime().optional(),
  })
  .strict();

const patchSchema = z
  .object({
    deliverableId: z.string().min(1),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE', 'BLOCKED']).optional(),
    summary: z.string().max(4000).optional(),
    dueAt: z.string().datetime().optional(),
  })
  .strict();

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const { id } = await params;
    const deliverables = await db.deliverable.findMany({
      where: { rfqId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ deliverables });
  } catch (error) {
    console.error('Failed to fetch deliverables:', error);
    return apiError(500, 'Failed to fetch deliverables');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const { id } = await params;
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }
    const data = parsed.data;
    const deliverable = await db.deliverable.create({
      data: {
        rfqId: id,
        type: data.type,
        title: data.title,
        summary: data.summary || null,
        dueAt: data.dueAt ? new Date(data.dueAt) : null,
      },
    });
    return NextResponse.json({ deliverable }, { status: 201 });
  } catch (error) {
    console.error('Failed to create deliverable:', error);
    return apiError(500, 'Failed to create deliverable');
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const { id } = await params;
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }
    const data = parsed.data;
    const existing = await db.deliverable.findUnique({
      where: { id: data.deliverableId },
      select: { id: true, rfqId: true },
    });
    if (!existing || existing.rfqId !== id) {
      return apiError(404, 'Deliverable not found');
    }
    const deliverable = await db.deliverable.update({
      where: { id: existing.id },
      data: {
        ...(data.status ? { status: data.status } : {}),
        ...(typeof data.summary === 'string' ? { summary: data.summary } : {}),
        ...(data.dueAt ? { dueAt: new Date(data.dueAt) } : {}),
        ...(data.status === 'DONE' ? { completedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ deliverable });
  } catch (error) {
    console.error('Failed to update deliverable:', error);
    return apiError(500, 'Failed to update deliverable');
  }
}
