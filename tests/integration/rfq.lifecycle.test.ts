import { beforeAll, describe, expect, it } from 'vitest';
import { encrypt } from '@/lib/session';
import { db } from '@/lib/db';

import { POST as postRfqs } from '@/app/api/rfqs/route';
import { POST as postMessage } from '@/app/api/rfqs/[id]/messages/route';
import { POST as postOffer } from '@/app/api/rfqs/[id]/offers/route';
import { PATCH as patchOffer } from '@/app/api/offers/[id]/route';
import { PATCH as patchRfq } from '@/app/api/rfqs/[id]/route';

async function ensureUsers() {
  const adminEmail = 'vitest-admin2@local.test';
  const memberEmail = 'vitest-member2@local.test';

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      passwordHash: 'x',
      role: 'ADMIN',
      teamRole: 'REQUESTER',
      accountType: 'COMPANY',
      name: 'Vitest Admin2',
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
      name: 'Vitest Member2',
      phone: '000',
      country: 'US',
      companyName: 'Vitest Member Co',
      vat: 'N/A',
    },
    select: { id: true },
  });

  return { adminId: admin.id, memberId: member.id };
}

describe('RFQ lifecycle (create -> message -> offer -> accept -> close)', () => {
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

  it('runs through core lifecycle', async () => {
    // 1) Create RFQ as member.
    const createReq = new Request('http://localhost/api/rfqs', {
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
    const createRes = await postRfqs(createReq);
    expect(createRes.status).toBe(200);
    const created = await createRes.json();
    const rfqId = created.rfq.id as string;
    expect(typeof rfqId).toBe('string');

    // 2) Buyer message.
    const msgReq = new Request(`http://localhost/api/rfqs/${rfqId}/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({ senderType: 'buyer', message: 'Hello, can you confirm availability?' }),
    });
    const msgRes = await postMessage(msgReq, { params: Promise.resolve({ id: rfqId }) });
    expect(msgRes.status).toBe(200);
    const msgJson = await msgRes.json();
    expect(msgJson.message?.message).toContain('confirm availability');

    // 3) Create offer (admin).
    const offerReq = new Request(`http://localhost/api/rfqs/${rfqId}/offers`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Offer #1',
        price: 65000,
        currency: 'EUR',
        terms: 'EXW',
        location: 'Rotterdam',
        availabilityText: 'Ready now',
        validUntil: '2026-03-01T00:00:00.000Z',
        includedFlags: {},
        notes: 'Includes inspection.',
      }),
    });
    const offerRes = await postOffer(offerReq, { params: Promise.resolve({ id: rfqId }) });
    expect(offerRes.status).toBe(200);
    const offerJson = await offerRes.json();
    const offerId = offerJson.offer.id as string;
    expect(typeof offerId).toBe('string');
    expect(offerJson.offer.status).toBe('Sent');

    // 4) Accept offer (member).
    const acceptReq = new Request(`http://localhost/api/offers/${offerId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({ status: 'Accepted' }),
    });
    const acceptRes = await patchOffer(acceptReq, { params: Promise.resolve({ id: offerId }) });
    expect(acceptRes.status).toBe(200);
    const acceptJson = await acceptRes.json();
    expect(acceptJson.offer.status).toBe('Accepted');

    // Verify RFQ moved to "Pending execution".
    const rfqAfterAccept = await db.rFQ.findUnique({ where: { id: rfqId } });
    expect(rfqAfterAccept?.status).toBe('PENDING_EXECUTION');

    // 5) Close RFQ as Won (member).
    const closeReq = new Request(`http://localhost/api/rfqs/${rfqId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({ closeStatus: 'Won', closeReason: 'Buyer selected offer and executed.' }),
    });
    const closeRes = await patchRfq(closeReq, { params: Promise.resolve({ id: rfqId }) });
    expect(closeRes.status).toBe(200);

    const rfqAfterClose = await db.rFQ.findUnique({ where: { id: rfqId } });
    expect(rfqAfterClose?.status).toBe('WON');
    expect(rfqAfterClose?.closeReason).toContain('executed');
  });

  it('rejects offer creation for non-admin', async () => {
    // Create RFQ first.
    const createReq = new Request('http://localhost/api/rfqs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({
        category: 'Truck',
        keySpecs: 'Need 1 truck with EU specs and 4x2 axle.',
        deliveryCountry: 'Germany',
        urgency: 'Normal',
        requiredDocuments: [],
        conditionTolerance: 'Good',
      }),
    });
    const createRes = await postRfqs(createReq);
    const { rfq } = await createRes.json();

    const offerReq = new Request(`http://localhost/api/rfqs/${rfq.id}/offers`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({
        title: 'Offer attempt',
        validUntil: '2026-03-01T00:00:00.000Z',
      }),
    });
    const offerRes = await postOffer(offerReq, { params: Promise.resolve({ id: rfq.id }) });
    expect(offerRes.status).toBe(401);
  });
});

