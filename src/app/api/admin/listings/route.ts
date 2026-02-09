import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit';
import { validateExportReadiness } from '@/lib/compliance';
import { apiError, apiValidationError } from '@/lib/api/errors';

const specSchema = z.object({
  key: z.string().min(1),
  value: z.string().min(1),
});

const mediaSchema = z.object({
  url: z.string().min(1),
  imageHint: z.string().optional().nullable(),
  sortOrder: z.number().int().nonnegative().optional(),
});

const documentSchema = z.object({
  name: z.string().min(1),
  type: z.enum(['REGISTRATION', 'COC', 'INSPECTION', 'MAINTENANCE']),
  url: z.string().min(1),
});

const internalNoteSchema = z.object({
  note: z.string().min(1),
});

const createListingSchema = z.object({
  title: z.string().min(3),
  category: z.enum(['TRUCK', 'TRAILER', 'HEAVY_EQUIPMENT']),
  brand: z.string().min(1),
  model: z.string().optional().nullable(),
  year: z.number().int().optional().nullable(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'USED', 'AS_IS']),
  country: z.string().min(1),
  city: z.string().optional().nullable(),
  description: z.string().min(10),
  extraNotes: z.string().optional().nullable(),
  visibility: z.enum(['PUBLIC', 'MEMBERS', 'HIDDEN']).default('PUBLIC'),
  verificationStatus: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED']).optional(),
  availabilityStatus: z.enum(['AVAILABLE', 'EXPECTED', 'RESERVED', 'SOLD']).default('AVAILABLE'),
  type: z.enum(['SINGLE', 'LOT']).default('SINGLE'),
  quantity: z.number().int().min(1).default(1),
  pricePerUnit: z.number().optional().nullable(),
  isFleetSeller: z.boolean().default(false),
  isExportReady: z.boolean().default(false),
  specs: z.array(specSchema).default([]),
  media: z.array(mediaSchema).default([]),
  documents: z.array(documentSchema).default([]),
  internalNotes: z.array(internalNoteSchema).default([]),
}).strict();

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (session.role !== 'admin' && session.role !== 'ADMIN') return apiError(403, 'Forbidden');

    const body = await request.json();
    const validation = createListingSchema.safeParse(body);

    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const data = validation.data;
    const compliance = validateExportReadiness(data.isExportReady, data.documents);
    if (!compliance.valid) {
      return apiError(400, compliance.message, { missingDocuments: compliance.missing });
    }

    const listing = await db.listing.create({
      data: {
        title: data.title,
        category: data.category,
        brand: data.brand,
        model: data.model ?? null,
        year: data.year ?? null,
        condition: data.condition,
        country: data.country,
        city: data.city ?? null,
        description: data.description,
        extraNotes: data.extraNotes ?? null,
        visibility: data.visibility,
        verificationStatus: data.verificationStatus ?? 'VERIFIED',
        availabilityStatus: data.availabilityStatus,
        type: data.type,
        quantity: data.quantity,
        pricePerUnit: data.pricePerUnit ?? null,
        isFleetSeller: data.isFleetSeller,
        isExportReady: data.isExportReady,
        creatorId: session.userId,
        specs: data.specs.length
          ? {
              createMany: {
                data: data.specs.map((spec) => ({
                  key: spec.key,
                  value: spec.value,
                })),
              },
            }
          : undefined,
        media: data.media.length
          ? {
              createMany: {
                data: data.media.map((media, index) => ({
                  url: media.url,
                  imageHint: media.imageHint ?? null,
                  sortOrder: media.sortOrder ?? index,
                })),
              },
            }
          : undefined,
        documents: data.documents.length
          ? {
              createMany: {
                data: data.documents.map((document) => ({
                  name: document.name,
                  type: document.type,
                  url: document.url,
                })),
              },
            }
          : undefined,
        internalNotes: data.internalNotes.length
          ? {
              createMany: {
                data: data.internalNotes.map((note) => ({
                  note: note.note,
                  authorId: session.userId,
                })),
              },
            }
          : undefined,
      },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        specs: true,
        documents: true,
        internalNotes: { orderBy: { createdAt: 'desc' } },
      },
    });

    await logAuditEvent({
      request,
      userId: session.userId,
      action: 'listing.create',
      entityId: listing.id,
      metadata: {
        title: listing.title,
        category: listing.category,
        country: listing.country,
      },
    });

    return NextResponse.json({ success: true, listing }, { status: 201 });
  } catch (error) {
    console.error('Failed to create listing:', error);
    return apiError(500, 'Internal Server Error');
  }
}
