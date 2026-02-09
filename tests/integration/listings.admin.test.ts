import { beforeAll, describe, expect, it } from 'vitest';
import { encrypt } from '@/lib/session';
import { db } from '@/lib/db';

import { POST as adminCreateListing } from '@/app/api/admin/listings/route';
import { PATCH as adminPatchListing, DELETE as adminDeleteListing } from '@/app/api/admin/listings/[id]/route';

async function ensureUsers() {
  const adminEmail = 'vitest-listings-admin@local.test';
  const memberEmail = 'vitest-listings-member@local.test';

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      passwordHash: 'x',
      role: 'ADMIN',
      teamRole: 'OWNER',
      accountType: 'COMPANY',
      name: 'Vitest Listings Admin',
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
      name: 'Vitest Listings Member',
      phone: '000',
      country: 'US',
      companyName: 'Vitest Member Co',
      vat: 'N/A',
    },
    select: { id: true },
  });

  return { adminId: admin.id, memberId: member.id };
}

describe('Admin listings CRUD', () => {
  let adminToken: string;
  let memberToken: string;

  beforeAll(async () => {
    const { adminId, memberId } = await ensureUsers();
    adminToken = await encrypt({
      userId: adminId,
      role: 'ADMIN',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    memberToken = await encrypt({
      userId: memberId,
      role: 'MEMBER',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
  });

  it('rejects create for non-admin', async () => {
    const req = new Request('http://localhost/api/admin/listings', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({
        title: 'Not allowed listing',
        category: 'TRUCK',
        brand: 'DAF',
        condition: 'GOOD',
        country: 'Netherlands',
        description: 'This should not be created by a non-admin user.',
        isExportReady: false,
      }),
    });

    const res = await adminCreateListing(req);
    expect(res.status).toBe(403);
  });

  it('creates, patches, and deletes a listing as admin', async () => {
    const createReq = new Request('http://localhost/api/admin/listings', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Vitest Admin Listing',
        category: 'TRUCK',
        brand: 'DAF',
        model: 'XF',
        year: 2021,
        condition: 'GOOD',
        country: 'Netherlands',
        city: 'Amsterdam',
        description: 'Integration-test created listing for admin CRUD.',
        visibility: 'PUBLIC',
        availabilityStatus: 'AVAILABLE',
        type: 'SINGLE',
        quantity: 1,
        isFleetSeller: false,
        isExportReady: false,
        specs: [{ key: 'Mileage', value: '100000 km' }],
        media: [{ url: 'https://example.com/x.jpg', imageHint: 'truck', sortOrder: 0 }],
        documents: [],
        internalNotes: [{ note: 'Created by vitest' }],
      }),
    });

    const createRes = await adminCreateListing(createReq);
    expect(createRes.status).toBe(201);
    const created = await createRes.json();
    const listingId = created.listing.id as string;
    expect(typeof listingId).toBe('string');

    const patchReq = new Request(`http://localhost/api/admin/listings/${listingId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${adminToken}`,
      },
      body: JSON.stringify({
        specs: [
          { key: 'Mileage', value: '101000 km' },
          { key: 'Color', value: 'White' },
        ],
      }),
    });
    const patchRes = await adminPatchListing(patchReq, { params: Promise.resolve({ id: listingId }) });
    expect(patchRes.status).toBe(200);
    const patched = await patchRes.json();
    expect(patched.listing.specs.length).toBeGreaterThanOrEqual(2);

    const delReq = new Request(`http://localhost/api/admin/listings/${listingId}`, {
      method: 'DELETE',
      headers: {
        cookie: `auth_session=${adminToken}`,
      },
    });
    const delRes = await adminDeleteListing(delReq, { params: Promise.resolve({ id: listingId }) });
    expect(delRes.status).toBe(200);
  });
});

