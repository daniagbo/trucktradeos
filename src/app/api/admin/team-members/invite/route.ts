import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { ensureUserOrganization } from '@/lib/organization';
import { hashPassword } from '@/lib/auth/password';
import { randomUUID } from 'crypto';
import { apiError, apiValidationError } from '@/lib/api/errors';

const inviteSchema = z
  .object({
    email: z.string().email(),
    name: z.string().min(2),
    teamRole: z.enum(['REQUESTER', 'APPROVER', 'MANAGER', 'OWNER']).default('REQUESTER'),
  })
  .strict();

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

function buildInviteExpiry() {
  return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
}

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const orgId = await ensureUserOrganization(session.userId);
    if (!orgId) return NextResponse.json({ invites: [] });

    const invites = await db.teamInvite.findMany({
      where: { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        invitedUser: { select: { id: true, email: true, name: true } },
        createdBy: { select: { id: true, email: true, name: true } },
      },
    });

    return NextResponse.json({ invites });
  } catch (error) {
    console.error('Failed to load invites:', error);
    return apiError(500, 'Failed to load invites');
  }
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const body = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return apiValidationError(parsed.error);
    }
    const data = parsed.data;

    const [orgId, adminUser] = await Promise.all([
      ensureUserOrganization(session.userId),
      db.user.findUnique({
        where: { id: session.userId },
        select: { country: true },
      }),
    ]);
    if (!orgId) {
      return apiError(400, 'Organization not found');
    }

    const organization = await db.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    });
    if (!organization) {
      return apiError(404, 'Organization not found');
    }

    const normalizedEmail = data.email.toLowerCase().trim();
    const existing = await db.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        teamRole: true,
      },
    });

    const tempPassword = generateTempPassword();
    const passwordHash = await hashPassword(tempPassword);
    const token = generateInviteToken();
    const expiresAt = buildInviteExpiry();

    if (existing) {
      if (existing.organizationId && existing.organizationId !== organization.id) {
        return apiError(409, 'User already belongs to another organization');
      }

      const updated = await db.user.update({
        where: { id: existing.id },
        data: {
          organizationId: organization.id,
          teamRole: data.teamRole,
          companyName: organization.name,
          passwordHash,
          mustChangePassword: true,
        },
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
      await db.teamInvite.create({
        data: {
          email: normalizedEmail,
          name: data.name,
          teamRole: data.teamRole,
          status: 'SENT',
          token,
          tempPasswordIssuedAt: new Date(),
          expiresAt,
          organizationId: organization.id,
          invitedUserId: updated.id,
          createdById: session.userId,
        },
      });
      return NextResponse.json({ member: updated, created: false, tempPassword });
    }

    const created = await db.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        mustChangePassword: true,
        name: data.name,
        role: 'MEMBER',
        accountType: 'COMPANY',
        country: adminUser?.country || 'Netherlands',
        companyName: organization.name,
        organizationId: organization.id,
        teamRole: data.teamRole,
      },
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

    await db.teamInvite.create({
      data: {
        email: normalizedEmail,
        name: data.name,
        teamRole: data.teamRole,
        status: 'SENT',
        token,
        tempPasswordIssuedAt: new Date(),
        expiresAt,
        organizationId: organization.id,
        invitedUserId: created.id,
        createdById: session.userId,
      },
    });

    return NextResponse.json({ member: created, created: true, tempPassword }, { status: 201 });
  } catch (error) {
    console.error('Failed to invite team member:', error);
    return apiError(500, 'Failed to invite team member');
  }
}
