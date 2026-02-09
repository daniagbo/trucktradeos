import { beforeAll, describe, expect, it } from 'vitest';
import { encrypt } from '@/lib/session';
import { db } from '@/lib/db';

import { POST as postRfqs } from '@/app/api/rfqs/route';
import { POST as requestApproval } from '@/app/api/rfqs/[id]/approval/route';
import { PATCH as decideApproval } from '@/app/api/rfqs/[id]/approval/[approvalId]/route';

async function ensureUsers() {
  const adminEmail = 'vitest-approver-admin@local.test';
  const memberEmail = 'vitest-approver-member@local.test';

  const admin = await db.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN', teamRole: 'OWNER' },
    create: {
      email: adminEmail,
      passwordHash: 'x',
      role: 'ADMIN',
      teamRole: 'OWNER',
      accountType: 'COMPANY',
      name: 'Vitest Approver Admin',
      phone: '000',
      country: 'US',
      companyName: 'Vitest Inc',
      vat: 'N/A',
    },
    select: { id: true },
  });

  const member = await db.user.upsert({
    where: { email: memberEmail },
    update: { role: 'MEMBER', teamRole: 'REQUESTER' },
    create: {
      email: memberEmail,
      passwordHash: 'x',
      role: 'MEMBER',
      teamRole: 'REQUESTER',
      accountType: 'COMPANY',
      name: 'Vitest Approver Member',
      phone: '000',
      country: 'US',
      companyName: 'Vitest Member Co',
      vat: 'N/A',
    },
    select: { id: true },
  });

  return { adminId: admin.id, memberId: member.id };
}

describe('Approval workflow (request -> approve)', () => {
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

  it('member can request approval and admin can approve', async () => {
    // Create RFQ as member.
    const createReq = new Request('http://localhost/api/rfqs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({
        category: 'Truck',
        keySpecs: 'Need approval-tested request with enough detail.',
        deliveryCountry: 'Germany',
        urgency: 'Normal',
        requiredDocuments: [],
        conditionTolerance: 'Good',
        serviceTier: 'Standard',
      }),
    });
    const createRes = await postRfqs(createReq);
    expect(createRes.status).toBe(200);
    const { rfq } = await createRes.json();

    // Request approval.
    const approvalReq = new Request(`http://localhost/api/rfqs/${rfq.id}/approval`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({ note: 'Please approve this RFQ.' }),
    });
    const approvalRes = await requestApproval(approvalReq, { params: Promise.resolve({ id: rfq.id }) });
    expect(approvalRes.status).toBe(201);
    const approvalJson = await approvalRes.json();
    const approvalId = approvalJson.approval.id as string;

    // Admin approves.
    const decideReq = new Request(`http://localhost/api/rfqs/${rfq.id}/approval/${approvalId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${adminToken}`,
      },
      body: JSON.stringify({ status: 'APPROVED', decisionNote: 'LGTM' }),
    });
    const decideRes = await decideApproval(decideReq, { params: Promise.resolve({ id: rfq.id, approvalId }) });
    expect(decideRes.status).toBe(200);
    const decideJson = await decideRes.json();
    expect(decideJson.approval.status).toBe('APPROVED');

    const persisted = await db.approvalRequest.findUnique({ where: { id: approvalId } });
    expect(persisted?.status).toBe('APPROVED');
  });

  it('rejects invalid approval decision payload', async () => {
    // Create RFQ and approval request.
    const createReq = new Request('http://localhost/api/rfqs', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({
        category: 'Truck',
        keySpecs: 'Need approval-tested request with enough detail.',
        deliveryCountry: 'Germany',
        urgency: 'Normal',
        requiredDocuments: [],
        conditionTolerance: 'Good',
      }),
    });
    const createRes = await postRfqs(createReq);
    const { rfq } = await createRes.json();

    const approvalReq = new Request(`http://localhost/api/rfqs/${rfq.id}/approval`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${memberToken}`,
      },
      body: JSON.stringify({ note: 'Please approve.' }),
    });
    const approvalRes = await requestApproval(approvalReq, { params: Promise.resolve({ id: rfq.id }) });
    const approvalJson = await approvalRes.json();
    const approvalId = approvalJson.approval.id as string;

    const badDecideReq = new Request(`http://localhost/api/rfqs/${rfq.id}/approval/${approvalId}`, {
      method: 'PATCH',
      headers: {
        'content-type': 'application/json',
        cookie: `auth_session=${adminToken}`,
      },
      body: JSON.stringify({ status: 'NOT_A_REAL_STATUS' }),
    });
    const badDecideRes = await decideApproval(badDecideReq, { params: Promise.resolve({ id: rfq.id, approvalId }) });
    expect(badDecideRes.status).toBe(400);
    const json = await badDecideRes.json();
    expect(json.message).toBe('Invalid input');
  });
});

