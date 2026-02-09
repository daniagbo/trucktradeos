import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { hashPassword } from '@/lib/auth/password';
import { randomUUID } from 'crypto';
import { apiError } from '@/lib/api/errors';

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

function generateTempPassword() {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `Temp#${suffix}9`;
}

function generateInviteToken() {
  return randomUUID().replace(/-/g, '');
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const { id } = await params;
    const orgId = await ensureUserOrganization(session.userId);
    if (!orgId) return apiError(400, 'Organization not found');

    const target = await db.user.findUnique({
      where: { id },
      select: { id: true, organizationId: true, email: true, name: true, teamRole: true },
    });
    if (!target || target.organizationId !== orgId) {
      return apiError(404, 'User not found');
    }

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    const updated = await db.$transaction(async (tx) => {
      await tx.teamInvite.updateMany({
        where: {
          organizationId: orgId,
          invitedUserId: target.id,
          status: 'SENT',
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });

      await tx.teamInvite.create({
        data: {
          email: target.email,
          name: target.name,
          teamRole: target.teamRole,
          status: 'SENT',
          token,
          tempPasswordIssuedAt: new Date(),
          expiresAt,
          organizationId: orgId,
          invitedUserId: target.id,
          createdById: session.userId,
        },
      });

      return tx.user.update({
        where: { id: target.id },
        data: { passwordHash, mustChangePassword: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          teamRole: true,
          organizationId: true,
          mustChangePassword: true,
        },
      });
    });

    return NextResponse.json({ member: updated, tempPassword });
  } catch (error) {
    console.error('Failed to reset member password:', error);
    return apiError(500, 'Failed to reset member password');
  }
}
