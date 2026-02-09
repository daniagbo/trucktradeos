import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { createNotification } from '@/lib/notifications';
import { logAuditEvent } from '@/lib/audit';
import { apiError, apiValidationError } from '@/lib/api/errors';

const patchSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  decisionNote: z.string().max(2000).optional(),
}).strict();

function isAdmin(role: string | undefined) {
  return role === 'ADMIN' || role === 'admin';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; approvalId: string }> }
) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const { id, approvalId } = await params;
    const body = await request.json();
    const validation = patchSchema.safeParse(body);
    if (!validation.success) {
      return apiValidationError(validation.error);
    }

    const approval = await db.approvalRequest.findUnique({
      where: { id: approvalId },
      include: {
        rfq: { select: { id: true, userId: true, serviceTier: true } },
        decisions: { select: { id: true, status: true } },
      },
    });
    if (!approval || approval.rfqId !== id) {
      return apiError(404, 'Approval request not found');
    }
    if (approval.status !== 'PENDING') {
      return apiError(409, 'Approval already decided');
    }

    const actor = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        role: true,
        teamRole: true,
        organizationId: true,
      },
    });
    if (!actor) {
      return apiError(401, 'Unauthorized');
    }

    const isDirectAssignee = approval.approverId === actor.id;
    const isOrganizationApprover =
      Boolean(approval.organizationId) &&
      approval.organizationId === actor.organizationId &&
      ['APPROVER', 'MANAGER', 'OWNER'].includes(actor.teamRole);

    if (!isAdmin(actor.role) && !isDirectAssignee && !isOrganizationApprover) {
      return apiError(403, 'Forbidden');
    }

    await db.approvalDecision.upsert({
      where: {
        approvalRequestId_approverId: {
          approvalRequestId: approvalId,
          approverId: session.userId,
        },
      },
      update: {
        status: validation.data.status,
        note: validation.data.decisionNote || null,
      },
      create: {
        approvalRequestId: approvalId,
        approverId: session.userId,
        status: validation.data.status,
        note: validation.data.decisionNote || null,
      },
    });

    const allDecisions = await db.approvalDecision.findMany({
      where: { approvalRequestId: approvalId },
      select: { status: true },
    });
    const approvedCount = allDecisions.filter((item) => item.status === 'APPROVED').length;
    const rejectedCount = allDecisions.filter((item) => item.status === 'REJECTED').length;

    const finalStatus =
      rejectedCount > 0
        ? 'REJECTED'
        : approvedCount >= approval.requiredApprovals
          ? 'APPROVED'
          : 'PENDING';

    const updated = await db.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: finalStatus,
        decisionNote:
          finalStatus === 'PENDING'
            ? approval.decisionNote
            : validation.data.decisionNote || approval.decisionNote || null,
        approverId: finalStatus === 'PENDING' ? approval.approverId : session.userId,
        decidedAt: finalStatus === 'PENDING' ? null : new Date(),
      },
      include: {
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
        decisions: {
          include: {
            approver: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (finalStatus === 'PENDING') {
      await createNotification({
        userId: approval.rfq.userId,
        type: 'RFQ',
        title: 'Approval step recorded',
        message: `RFQ ${id.slice(0, 10)} approval progress: ${approvedCount}/${approval.requiredApprovals}.`,
        metadata: {
          rfqId: id,
          approvalId,
          status: finalStatus,
          approvedCount,
          requiredApprovals: approval.requiredApprovals,
        },
      });
    } else {
      await createNotification({
        userId: approval.rfq.userId,
        type: 'RFQ',
        title: finalStatus === 'APPROVED' ? 'RFQ approved' : 'RFQ rejected',
        message: `Approval request for RFQ ${id.slice(0, 10)} was ${finalStatus.toLowerCase()}.`,
        metadata: {
          rfqId: id,
          approvalId,
          status: finalStatus,
          approvedCount,
          requiredApprovals: approval.requiredApprovals,
        },
      });
    }

    await logAuditEvent({
      request,
      userId: session.userId,
      action: 'rfq.approval.decided',
      entityId: id,
      metadata: {
        approvalId,
        status: finalStatus,
        approvedCount,
        requiredApprovals: approval.requiredApprovals,
      },
    });

    return NextResponse.json({ approval: updated });
  } catch (error) {
    console.error('Failed to decide approval request:', error);
    return apiError(500, 'Failed to decide approval request');
  }
}
