import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { passwordSchema } from '@/lib/auth/validation';
import { apiError, apiValidationError } from '@/lib/api/errors';

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: passwordSchema,
  })
  .strict();

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, passwordHash: true },
    });
    if (!user) {
      return apiError(404, 'User not found');
    }

    const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
    if (!valid) {
      return apiError(401, 'Current password is incorrect');
    }

    const nextHash = await hashPassword(parsed.data.newPassword);
    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: nextHash,
          mustChangePassword: false,
        },
      });

      await tx.teamInvite.updateMany({
        where: {
          invitedUserId: user.id,
          status: 'SENT',
        },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          acceptedById: user.id,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to change password:', error);
    return apiError(500, 'Failed to change password');
  }
}
