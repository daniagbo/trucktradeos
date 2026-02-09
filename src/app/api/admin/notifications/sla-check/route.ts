import { NextResponse } from 'next/server';
import { verifySessionFromRequest } from '@/lib/session';
import { runSlaReminderSweep } from '@/lib/notifications';
import { apiError } from '@/lib/api/errors';

function isAdmin(role: string | undefined) {
  return role === 'admin' || role === 'ADMIN';
}

export async function POST(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const result = await runSlaReminderSweep();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('Failed SLA reminder sweep:', error);
    return apiError(500, 'Internal Server Error');
  }
}
