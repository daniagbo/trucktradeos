import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { apiError, apiValidationError } from '@/lib/api/errors';

const updateSchema = z
  .object({
    userId: z.string().min(1),
    teamRole: z.enum(['REQUESTER', 'APPROVER', 'MANAGER', 'OWNER']),
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

    let currentUser = await db.user.findUnique({
      where: { id: session.userId },
      select: { organizationId: true },
    });
    if (!currentUser?.organizationId) {
      const orgId = await ensureUserOrganization(session.userId);
      currentUser = { organizationId: orgId };
    }
    if (!currentUser?.organizationId) {
      return NextResponse.json({ members: [] });
    }

    const members = await db.user.findMany({
      where: { organizationId: currentUser.organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        teamRole: true,
        mustChangePassword: true,
        createdAt: true,
      },
      orderBy: [{ teamRole: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ members });
  } catch (error) {
    console.error('Failed to load team members:', error);
    return apiError(500, 'Failed to load team members');
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }

    let [currentUser, target] = await Promise.all([
      db.user.findUnique({
        where: { id: session.userId },
        select: { organizationId: true },
      }),
      db.user.findUnique({
        where: { id: parsed.data.userId },
        select: { id: true, organizationId: true },
      }),
    ]);
    if (!currentUser?.organizationId) {
      const orgId = await ensureUserOrganization(session.userId);
      currentUser = { organizationId: orgId };
    }

    if (!currentUser?.organizationId || !target) {
      return apiError(404, 'User not found');
    }
    if (target.organizationId !== currentUser.organizationId) {
      return apiError(403, 'Forbidden');
    }

    const updated = await db.user.update({
      where: { id: target.id },
      data: { teamRole: parsed.data.teamRole },
      select: { id: true, name: true, email: true, role: true, teamRole: true, mustChangePassword: true },
    });

    return NextResponse.json({ member: updated });
  } catch (error) {
    console.error('Failed to update team role:', error);
    return apiError(500, 'Failed to update team role');
  }
}
