import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { apiError, apiValidationError } from '@/lib/api/errors';

const createTemplateSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional().nullable(),
  title: z.string().min(3),
  currency: z.string().min(1).default('USD'),
  terms: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  availabilityText: z.string().optional().nullable(),
  includedFlags: z.record(z.boolean()).default({}),
  notes: z.string().optional().nullable(),
  isDefault: z.boolean().optional().default(false),
}).strict();

function isAdmin(role: string | undefined) {
  return role === 'admin' || role === 'ADMIN';
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const templates = await db.offerTemplate.findMany({
      where: {
        userId: session.userId,
        OR: category
          ? [{ category }, { category: null }]
          : undefined,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Failed to fetch offer templates:', error);
    return apiError(500, 'Internal Server Error');
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const body = await request.json();
    const validation = createTemplateSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const data = validation.data;
    const template = await db.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.offerTemplate.updateMany({
          where: { userId: session.userId, category: data.category || null, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.offerTemplate.create({
        data: {
          name: data.name,
          category: data.category || null,
          title: data.title,
          currency: data.currency,
          terms: data.terms || null,
          location: data.location || null,
          availabilityText: data.availabilityText || null,
          includedFlags: data.includedFlags as Prisma.InputJsonValue,
          notes: data.notes || null,
          isDefault: data.isDefault,
          userId: session.userId,
        },
      });
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error('Failed to create offer template:', error);
    return apiError(500, 'Internal Server Error');
  }
}
