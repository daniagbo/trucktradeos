import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
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

const patchListingSchema = z.object({
  title: z.string().min(3).optional(),
  category: z.enum(['TRUCK', 'TRAILER', 'HEAVY_EQUIPMENT']).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().nullable().optional(),
  year: z.number().int().nullable().optional(),
  condition: z.enum(['EXCELLENT', 'GOOD', 'USED', 'AS_IS']).optional(),
  country: z.string().min(1).optional(),
  city: z.string().nullable().optional(),
  description: z.string().min(10).optional(),
  extraNotes: z.string().nullable().optional(),
  visibility: z.enum(['PUBLIC', 'MEMBERS', 'HIDDEN']).optional(),
  verificationStatus: z.enum(['UNVERIFIED', 'PENDING', 'VERIFIED']).optional(),
  availabilityStatus: z.enum(['AVAILABLE', 'EXPECTED', 'RESERVED', 'SOLD']).optional(),
  type: z.enum(['SINGLE', 'LOT']).optional(),
  quantity: z.number().int().min(1).optional(),
  pricePerUnit: z.number().nullable().optional(),
  isFleetSeller: z.boolean().optional(),
  isExportReady: z.boolean().optional(),
  specs: z.array(specSchema).optional(),
  media: z.array(mediaSchema).optional(),
  documents: z.array(documentSchema).optional(),
  internalNotes: z.array(internalNoteSchema).optional(),
}).strict();

function isAdmin(role: string | undefined) {
  return role === 'admin' || role === 'ADMIN';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const body = await request.json();
    const validation = patchListingSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const data = validation.data;
    const {
      specs,
      media,
      documents,
      internalNotes,
      ...scalarData
    } = data;

    const current = await db.listing.findUnique({
      where: { id },
      include: { documents: { select: { type: true } } },
    });
    if (!current) {
      return apiError(404, 'Listing not found');
    }

    const nextIsExportReady =
      typeof data.isExportReady === 'boolean' ? data.isExportReady : current.isExportReady;
    const nextDocuments = documents ?? current.documents;
    const compliance = validateExportReadiness(nextIsExportReady, nextDocuments);
    if (!compliance.valid) {
      return apiError(400, compliance.message, { missingDocuments: compliance.missing });
    }

    await db.$transaction(async (tx) => {
      await tx.listing.update({
        where: { id },
        data: scalarData,
      });

      if (specs) {
        await tx.spec.deleteMany({ where: { listingId: id } });
        if (specs.length) {
          await tx.spec.createMany({
            data: specs.map((spec) => ({
              listingId: id,
              key: spec.key,
              value: spec.value,
            })),
          });
        }
      }

      if (media) {
        await tx.media.deleteMany({ where: { listingId: id } });
        if (media.length) {
          await tx.media.createMany({
            data: media.map((item, index) => ({
              listingId: id,
              url: item.url,
              imageHint: item.imageHint ?? null,
              sortOrder: item.sortOrder ?? index,
            })),
          });
        }
      }

      if (documents) {
        await tx.document.deleteMany({ where: { listingId: id } });
        if (documents.length) {
          await tx.document.createMany({
            data: documents.map((document) => ({
              listingId: id,
              name: document.name,
              type: document.type,
              url: document.url,
            })),
          });
        }
      }

      if (internalNotes) {
        await tx.internalNote.deleteMany({ where: { listingId: id } });
        if (internalNotes.length) {
          await tx.internalNote.createMany({
            data: internalNotes.map((note) => ({
              listingId: id,
              note: note.note,
              authorId: session.userId,
            })),
          });
        }
      }
    });

    const listing = await db.listing.findUnique({
      where: { id },
      include: {
        media: { orderBy: { sortOrder: 'asc' } },
        specs: true,
        documents: true,
        internalNotes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!listing) {
      return apiError(404, 'Listing not found');
    }

    await logAuditEvent({
      request,
      userId: session.userId,
      action: 'listing.update',
      entityId: id,
      metadata: {
        updatedFields: Object.keys(data),
        title: listing.title,
      },
    });

    return NextResponse.json({ success: true, listing });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return apiError(404, 'Listing not found');
    }
    console.error('Failed to update listing:', error);
    return apiError(500, 'Internal Server Error');
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    await db.listing.delete({
      where: { id },
    });

    await logAuditEvent({
      request,
      userId: session.userId,
      action: 'listing.delete',
      entityId: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return apiError(404, 'Listing not found');
    }
    console.error('Failed to delete listing:', error);
    return apiError(500, 'Internal Server Error');
  }
}
