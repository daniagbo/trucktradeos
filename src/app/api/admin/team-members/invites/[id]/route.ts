import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { apiError, apiValidationError } from '@/lib/api/errors';

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

function generateTempPassword() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `Temp#${suffix}9`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const orgId = await ensureUserOrganization(session.userId);
    if (!orgId) return apiError(400, 'Organization not found');

    const { id } = await params;
    const invite = await db.teamInvite.findUnique({
      where: { id },
      include: { invitedUser: true },
    });
    if (!invite || invite.organizationId !== orgId) {
      return apiError(404, 'Invite not found');
    }
    if (!invite.invitedUserId) {
      return apiError(400, 'Invite has no target user');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    const token = randomUUID().replace(/-/g, '');

    const updatedInvite = await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: invite.invitedUserId! },
        data: {
          passwordHash,
          mustChangePassword: true,
        },
      });
      return tx.teamInvite.update({
        where: { id: invite.id },
        data: {
          status: 'SENT',
          token,
          tempPasswordIssuedAt: new Date(),
          expiresAt,
          revokedAt: null,
          acceptedAt: null,
          acceptedById: null,
        },
      });
    });

    return NextResponse.json({ invite: updatedInvite, tempPassword });
  } catch (error) {
    console.error('Failed to regenerate invite:', error);
    return apiError(500, 'Failed to regenerate invite');
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');
    const orgId = await ensureUserOrganization(session.userId);
    if (!orgId) return apiError(400, 'Organization not found');
    const { id } = await params;
    // Prevent accidental shadowing from the body.

    const patchSchema = z.object({ status: z.enum(['REVOKED', 'EXPIRED']) }).strict();
    const parsed = patchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }
    const body = parsed.data;

    const invite = await db.teamInvite.findUnique({
      where: { id },
      select: { id: true, organizationId: true },
    });
    if (!invite || invite.organizationId !== orgId) {
      return apiError(404, 'Invite not found');
    }

    const updated = await db.teamInvite.update({
      where: { id: invite.id },
      data: {
        status: body.status,
        ...(body.status === 'REVOKED' ? { revokedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ invite: updated });
  } catch (error) {
    console.error('Failed to update invite:', error);
    return apiError(500, 'Failed to update invite');
  }
}
