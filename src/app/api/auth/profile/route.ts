import { NextResponse } from 'next/server';
import { z } from 'zod';
import { verifySessionFromRequest } from '@/lib/session';
import { db } from '@/lib/db';
import { apiError, apiValidationError } from '@/lib/api/errors';

const profileSchema = z.object({
  accountType: z.enum(['individual', 'company']).optional(),
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  country: z.string().min(2).optional(),
  companyName: z.string().optional(),
  vat: z.string().optional(),
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  linkedinUrl: z.string().url().or(z.literal('')).optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const body = await request.json();
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const data = parsed.data;
    const updated = await db.user.update({
      where: { id: session.userId },
      data: {
        ...(typeof data.accountType === 'string' ? { accountType: data.accountType.toUpperCase() as 'INDIVIDUAL' | 'COMPANY' } : {}),
        ...(typeof data.name === 'string' ? { name: data.name } : {}),
        ...(typeof data.phone === 'string' ? { phone: data.phone } : {}),
        ...(typeof data.country === 'string' ? { country: data.country } : {}),
        ...(typeof data.companyName === 'string' ? { companyName: data.companyName } : {}),
        ...(typeof data.vat === 'string' ? { vat: data.vat } : {}),
        ...(typeof data.headline === 'string' ? { headline: data.headline } : {}),
        ...(typeof data.bio === 'string' ? { bio: data.bio } : {}),
        ...(typeof data.website === 'string' ? { website: data.website || null } : {}),
        ...(typeof data.linkedinUrl === 'string' ? { linkedinUrl: data.linkedinUrl || null } : {}),
      },
    });

    const { passwordHash, ...safeUser } = updated;
    return NextResponse.json({
      user: {
        ...safeUser,
        createdAt: safeUser.createdAt.toISOString(),
        updatedAt: safeUser.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Profile update failed:', error);
    return apiError(500, 'Failed to update profile');
  }
}
