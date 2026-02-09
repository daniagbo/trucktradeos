import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { apiError } from '@/lib/api/errors';

type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  roleHint?: string;
};

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const [user, rfqCount, pendingApprovals] = await Promise.all([
      db.user.findUnique({
        where: { id: session.userId },
        select: {
          mustChangePassword: true,
          accountType: true,
          country: true,
          phone: true,
          headline: true,
          bio: true,
          companyName: true,
          vat: true,
          role: true,
          teamRole: true,
          organizationId: true,
        },
      }),
      db.rFQ.count({ where: { userId: session.userId } }),
      db.approvalRequest.count({
        where: {
          approverId: session.userId,
          status: 'PENDING',
        },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ items: [], completionRate: 0 });
    }

    const items: ChecklistItem[] = [
      {
        key: 'password',
        label: 'Set your permanent password',
        done: !user.mustChangePassword,
      },
      {
        key: 'profile_basics',
        label: 'Complete profile basics (country, phone, headline)',
        done: Boolean(user.country && user.phone && user.headline),
      },
      {
        key: 'profile_story',
        label: 'Add buyer bio and sourcing context',
        done: Boolean(user.bio && user.bio.length >= 40),
      },
      {
        key: 'first_rfq',
        label: 'Create your first RFQ',
        done: rfqCount > 0,
      },
      {
        key: 'org_verification',
        label: 'Complete organization identity (company + VAT)',
        done: user.accountType !== 'COMPANY' || Boolean(user.companyName && user.vat),
      },
    ];

    if (user.teamRole === 'APPROVER' || user.teamRole === 'MANAGER' || user.teamRole === 'OWNER') {
      items.push({
        key: 'approval_queue',
        label: 'Review pending approval queue',
        done: pendingApprovals === 0,
        roleHint: 'approver',
      });
    }

    const doneCount = items.filter((item) => item.done).length;
    const completionRate = items.length > 0 ? Math.round((doneCount / items.length) * 100) : 100;

    return NextResponse.json({ items, completionRate, pendingApprovals, rfqCount });
  } catch (error) {
    console.error('Failed to build onboarding checklist:', error);
    return apiError(500, 'Failed to build onboarding checklist');
  }
}
