import { describe, expect, it, beforeAll } from 'vitest';
import { encrypt } from '@/lib/session';
import { db } from '@/lib/db';
import { POST as postRfqs } from '@/app/api/rfqs/route';

async function ensureTestUsers() {
  // Minimal required fields for Prisma schema.
  const adminEmail = 'vitest-admin@local.test';
  const memberEmail = 'vitest-member@local.test';

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: 'x',
      role: 'ADMIN',
      teamRole: 'REQUESTER',
      accountType: 'COMPANY',
      name: 'Vitest Admin',
      phone: '000',
      country: 'US',
      companyName: 'Vitest Inc',
      vat: 'N/A',
    },
    select: { id: true },
  });

  const member = await db.user.upsert({
    where: { email: memberEmail },
    update: {},
    create: {
      email: memberEmail,
      passwordHash: 'x',
      role: 'MEMBER',
      teamRole: 'REQUESTER',
      accountType: 'COMPANY',
      name: 'Vitest Member',
      phone: '000',
      country: 'US',
      companyName: 'Vitest Member Co',
      vat: 'N/A',
    },
    select: { id: true },
  });

  return { adminId: admin.id, memberId: member.id };
}

describe('POST /api/rfqs', () => {
  let memberToken: string;

  beforeAll(async () => {
    const { memberId } = await ensureTestUsers();
    memberToken = await encrypt({
      userId: memberId,
      role: 'MEMBER',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
  });

  it('returns 400 with field errors for invalid payload', async () => {
    const req = new Request('http://localhost/api/rfqs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({
        category: 'Truck',
        deliveryCountry: 'Germany',
        urgency: 'Normal',
        requiredDocuments: [],
        conditionTolerance: 'Good',
      }),
    });

    const res = await postRfqs(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.message).toBe('Invalid input');
    expect(json.errors?.keySpecs?.length).toBeGreaterThan(0);
  });

  it('creates an RFQ for valid payload', async () => {
    const req = new Request('http://localhost/api/rfqs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({
        category: 'Truck',
        keySpecs: 'Need 1 truck with EU specs and 4x2 axle.',
        preferredBrands: 'Scania',
        deliveryCountry: 'Germany',
        urgency: 'Normal',
        requiredDocuments: [],
        conditionTolerance: 'Good',
        serviceTier: 'Standard',
        servicePackage: 'Core',
        packageAddons: [],
      }),
    });

    const res = await postRfqs(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.rfq?.id).toBe('string');
    expect(json.rfq.keySpecs).toContain('Need 1 truck');
  });
});

