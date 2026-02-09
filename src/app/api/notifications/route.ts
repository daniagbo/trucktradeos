import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { apiError } from '@/lib/api/errors';

export async function GET(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { userId: session.userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      db.notification.count({
        where: { userId: session.userId, read: false },
      }),
    ]);

    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return apiError(500, 'Internal Server Error');
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) {
      return apiError(401, 'Unauthorized');
    }

    await db.notification.updateMany({
      where: { userId: session.userId, read: false },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to mark notifications read:', error);
    return apiError(500, 'Internal Server Error');
  }
}
