import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySessionFromRequest } from '@/lib/session';
import { apiError } from '@/lib/api/errors';

function isAdmin(role: string | undefined) {
  return role === 'admin' || role === 'ADMIN';
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await verifySessionFromRequest(request);
    if (!session?.userId) return apiError(401, 'Unauthorized');
    if (!isAdmin(session.role)) return apiError(403, 'Forbidden');

    const { id } = await params;
    const existing = await db.offerTemplate.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.userId) {
      return apiError(404, 'Template not found');
    }

    await db.offerTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete offer template:', error);
    return apiError(500, 'Internal Server Error');
  }
}
