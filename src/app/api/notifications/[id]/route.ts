import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { apiError } from '@/lib/api/errors';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const { id } = await params;
    const notification = await db.notification.findUnique({
      where: { id },
      select: { id: true, userId: true },
    });

    if (!notification || notification.userId !== session.userId) {
      return apiError(404, 'Not found');
    }

    await db.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notification read:', error);
    return apiError(500, 'Internal Server Error');
  }
}
