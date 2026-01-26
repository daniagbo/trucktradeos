
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> } // Standard Next.js 15 params matching
) {
    try {
        const { id } = await params;

        // RBAC: Admin only
        const session = await verifySession();
        if (!session || (session.role !== 'admin' && session.role !== 'ADMIN')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();

        // Allow partial updates
        // In a full app, re-validate with Zod partial schema

        const listing = await db.listing.update({
            where: { id },
            data: body,
        });

        return NextResponse.json({ success: true, listing });
    } catch (error) {
        console.error('Failed to update listing:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // RBAC: Admin only
        const session = await verifySession();
        if (!session || (session.role !== 'admin' && session.role !== 'ADMIN')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        await db.listing.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to delete listing:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
