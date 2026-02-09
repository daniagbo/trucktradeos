import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { z } from 'zod';
import { createAdminNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { resolveApprovalRouting } from '@/lib/approval-policy';
import { Prisma } from '@prisma/client';
import { apiError, apiValidationError } from '@/lib/api/errors';

const createSchema = z.object({
  note: z.string().max(2000).optional(),
  requiredApprovals: z.number().int().min(1).max(5).optional(),
}).strict();

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(_request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const { id } = await params;
    const rfq = await db.rFQ.findUnique({ where: { id } });
    if (!rfq) return apiError(404, 'RFQ not found');

    const admin = isAdmin(session.role);
    if (!admin && rfq.userId !== session.userId) {
      return apiError(403, 'Forbidden');
    }

    const approvals = await db.approvalRequest.findMany({
      where: { rfqId: id },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        policy: {
          select: {
            id: true,
            serviceTier: true,
            requiredApprovals: true,
            approverTeamRole: true,
            autoAssignEnabled: true,
            active: true,
          },
        },
        organization: {
          select: { id: true, name: true, slug: true },
        },
        decisions: {
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ approvals });
  } catch (error) {
    console.error('Failed to fetch approvals:', error);
    return apiError(500, 'Failed to fetch approvals');
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const { id } = await params;
    const rfq = await db.rFQ.findUnique({ where: { id } });
    if (!rfq) return apiError(404, 'RFQ not found');

    if (rfq.userId !== session.userId) {
      return apiError(403, 'Forbidden');
    }

    const body = await request.json();
    const validation = createSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const existingPending = await db.approvalRequest.findFirst({
      where: { rfqId: id, status: 'PENDING' },
      select: { id: true },
    });
    if (existingPending) {
      return apiError(409, 'There is already a pending approval for this RFQ.');
    }

    const routing = await resolveApprovalRouting({
      requesterId: session.userId,
      serviceTier: rfq.serviceTier,
      requiredApprovalsOverride: validation.data.requiredApprovals,
    });

    const approval = await db.approvalRequest.create({
      data: {
        rfqId: id,
        requesterId: session.userId,
        requiredApprovals: routing.requiredApprovals,
        note: validation.data.note || null,
        approverId: routing.primaryApproverId,
        organizationId: routing.organizationId,
        policyId: routing.policyId,
        candidateApproverIds: routing.approverIds as Prisma.InputJsonValue,
      },
      include: {
        requester: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        policy: {
          select: {
            id: true,
            serviceTier: true,
            requiredApprovals: true,
            approverTeamRole: true,
            autoAssignEnabled: true,
            active: true,
          },
        },
        organization: { select: { id: true, name: true, slug: true } },
        decisions: true,
      },
    });

    await createAdminNotification({
      type: 'RFQ',
      title: 'Approval requested',
      message: `RFQ ${id.slice(0, 10)} has a new approval request.`,
      metadata: {
        rfqId: id,
        approvalId: approval.id,
        requiredApprovals: routing.requiredApprovals,
        assigneeCount: routing.approverIds.length,
        policySource: routing.policySource,
      },
    });

    await logAuditEvent({
      request,
      userId: session.userId,
      action: 'rfq.approval.requested',
      entityId: id,
      metadata: {
        approvalId: approval.id,
        requiredApprovals: routing.requiredApprovals,
        assignedApproverIds: routing.approverIds,
        policyId: routing.policyId,
        policySource: routing.policySource,
      },
    });

    return NextResponse.json(
      {
        approval,
        routing: {
          requiredApprovals: routing.requiredApprovals,
          policyId: routing.policyId,
          policySource: routing.policySource,
          assigneeCount: routing.approverIds.length,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create approval request:', error);
    return apiError(500, 'Failed to create approval request');
  }
}
