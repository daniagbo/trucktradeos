import { beforeAll, describe, expect, it } from 'vitest';
import { encrypt } from '@/lib/session';
import { db } from '@/lib/db';

import { GET as getNotifications, PATCH as patchNotifications } from '@/app/api/notifications/route';
import { PATCH as patchNotificationById } from '@/app/api/notifications/[id]/route';
import { GET as getWatchlist, POST as postWatchlist, DELETE as deleteWatchlist } from '@/app/api/watchlist/route';
import { GET as getApprovalPolicies, POST as postApprovalPolicy } from '@/app/api/admin/approval-policies/route';

async function ensureUsers() {
  const adminEmail = 'vitest-admin-audit@local.test';
  const memberEmail = 'vitest-member-audit@local.test';

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      passwordHash: 'x',
      role: 'ADMIN',
      teamRole: 'OWNER',
      accountType: 'COMPANY',
      name: 'Vitest Admin Audit',
      phone: '000',
      country: 'US',
      companyName: 'Vitest Inc',
      vat: 'N/A',
    },
    select: { id: true },
  });

  const member = await db.user.upsert({
    where: { email: memberEmail },
    update: { role: 'MEMBER' },
    create: {
      email: memberEmail,
      passwordHash: 'x',
      role: 'MEMBER',
      teamRole: 'REQUESTER',
      accountType: 'COMPANY',
      name: 'Vitest Member Audit',
      phone: '000',
      country: 'US',
      companyName: 'Vitest Member Co',
      vat: 'N/A',
    },
    select: { id: true },
  });

  return { adminId: admin.id, memberId: member.id };
}

describe('Notifications + Watchlist + Admin auth standardization', () => {
  let adminToken: string;
  let memberToken: string;
  let memberId: string;

  beforeAll(async () => {
    const users = await ensureUsers();
    memberId = users.memberId;
    adminToken = await encrypt({
      userId: users.adminId,
      role: 'ADMIN',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    memberToken = await encrypt({
      userId: users.memberId,
      role: 'MEMBER',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
  });

  it('notifications: list + mark all read + mark single read', async () => {
    // Seed 2 unread and 1 read.
    await db.notification.createMany({
      data: [
        { userId: memberId, type: 'SYSTEM', title: 'N1', message: 'one', read: false },
        { userId: memberId, type: 'RFQ', title: 'N2', message: 'two', read: false },
        { userId: memberId, type: 'SYSTEM', title: 'N3', message: 'three', read: true },
      ],
      skipDuplicates: true,
    });

    const listReq = new Request('http://localhost/api/notifications?limit=50', {
      method: 'GET',
      headers: { cookie: `auth_session=${memberToken}` },
    });
    const listRes = await getNotifications(listReq);
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json();
    expect(Array.isArray(listJson.notifications)).toBe(true);
    expect(typeof listJson.unreadCount).toBe('number');
    expect(listJson.unreadCount).toBeGreaterThanOrEqual(2);

    // Mark all as read.
    const patchAllReq = new Request('http://localhost/api/notifications', {
      method: 'PATCH',
      headers: { cookie: `auth_session=${memberToken}` },
    });
    const patchAllRes = await patchNotifications(patchAllReq);
    expect(patchAllRes.status).toBe(200);

    const unreadAfterAll = await db.notification.count({ where: { userId: memberId, read: false } });
    expect(unreadAfterAll).toBe(0);

    // Create one more unread and mark it read by id.
    const created = await db.notification.create({
      data: { userId: memberId, type: 'SYSTEM', title: 'N4', message: 'four', read: false },
      select: { id: true },
    });
    const patchOneReq = new Request(`http://localhost/api/notifications/${created.id}`, {
      method: 'PATCH',
      headers: { cookie: `auth_session=${memberToken}` },
    });
    const patchOneRes = await patchNotificationById(patchOneReq, { params: Promise.resolve({ id: created.id }) });
    expect(patchOneRes.status).toBe(200);
    const n4 = await db.notification.findUnique({ where: { id: created.id }, select: { read: true } });
    expect(n4?.read).toBe(true);
  });

  it('watchlist: admin-only pin/unpin; unauth 401; member 403', async () => {
    const unauthPinReq = new Request('http://localhost/api/watchlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ entityType: 'LISTING', entityId: 'x' }),
    });
    const unauthPinRes = await postWatchlist(unauthPinReq);
    expect(unauthPinRes.status).toBe(401);

    const memberPinReq = new Request('http://localhost/api/watchlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `auth_session=${memberToken}` },
      body: JSON.stringify({ entityType: 'LISTING', entityId: 'listing-123' }),
    });
    const memberPinRes = await postWatchlist(memberPinReq);
    expect(memberPinRes.status).toBe(403);

    const adminPinReq = new Request('http://localhost/api/watchlist', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `auth_session=${adminToken}` },
      body: JSON.stringify({ entityType: 'LISTING', entityId: 'listing-123' }),
    });
    const adminPinRes = await postWatchlist(adminPinReq);
    expect(adminPinRes.status).toBe(201);

    const listReq = new Request('http://localhost/api/watchlist', {
      method: 'GET',
      headers: { cookie: `auth_session=${adminToken}` },
    });
    const listRes = await getWatchlist(listReq);
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json();
    expect(Array.isArray(listJson.items)).toBe(true);

    const adminDelReq = new Request('http://localhost/api/watchlist', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json', cookie: `auth_session=${adminToken}` },
      body: JSON.stringify({ entityType: 'LISTING', entityId: 'listing-123' }),
    });
    const adminDelRes = await deleteWatchlist(adminDelReq);
    expect(adminDelRes.status).toBe(200);
  });

  it('admin approval-policies: unauth 401; member 403; admin can GET+POST', async () => {
    const unauthReq = new Request('http://localhost/api/admin/approval-policies', { method: 'GET' });
    const unauthRes = await getApprovalPolicies(unauthReq);
    expect(unauthRes.status).toBe(401);

    const memberReq = new Request('http://localhost/api/admin/approval-policies', {
      method: 'GET',
      headers: { cookie: `auth_session=${memberToken}` },
    });
    const memberRes = await getApprovalPolicies(memberReq);
    expect(memberRes.status).toBe(403);

    const adminReq = new Request('http://localhost/api/admin/approval-policies', {
      method: 'GET',
      headers: { cookie: `auth_session=${adminToken}` },
    });
    const adminRes = await getApprovalPolicies(adminReq);
    expect(adminRes.status).toBe(200);

    const createReq = new Request('http://localhost/api/admin/approval-policies', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: `auth_session=${adminToken}` },
      body: JSON.stringify({
        serviceTier: 'STANDARD',
        requiredApprovals: 1,
        approverTeamRole: 'APPROVER',
        autoAssignEnabled: true,
        warningThresholdRatio: 1,
        criticalThresholdRatio: 1.5,
        active: true,
      }),
    });
    const createRes = await postApprovalPolicy(createReq);
    expect(createRes.status).toBe(201);
    const createJson = await createRes.json();
    expect(createJson.policy?.serviceTier).toBe('STANDARD');
  });
});

