
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySession } from '@/lib/session';
import { z } from 'zod';

const createListingSchema = z.object({
    title: z.string().min(3),
    category: z.enum(['TRUCK', 'TRAILER', 'HEAVY_EQUIPMENT']),
    brand: z.string().min(1),
    model: z.string().optional(),
    year: z.number().optional(),
    condition: z.enum(['EXCELLENT', 'GOOD', 'USED', 'AS_IS']),
    country: z.string().min(1),
    city: z.string().optional(),
    description: z.string().min(10),
    visibility: z.enum(['PUBLIC', 'MEMBERS', 'HIDDEN']).default('PUBLIC'),
    type: z.enum(['SINGLE', 'LOT']).default('SINGLE'),
    quantity: z.number().default(1),
    pricePerUnit: z.number().optional(),
});

export async function POST(request: Request) {
    try {
        // RBAC: Admin only
        const session = await verifySession();

        if (!session || (session.role !== 'admin' && session.role !== 'ADMIN')) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
        }

        const body = await request.json();
        const validation = createListingSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { message: 'Invalid input', errors: validation.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = validation.data;

        // Create listing with relations
        // Note: session.userId from verifySession matches DB User ID (as verified in PR1)
        const listing = await db.listing.create({
            data: {
                title: data.title,
                category: data.category,
                brand: data.brand,
                model: data.model,
                year: data.year,
                condition: data.condition,
                country: data.country,
                city: data.city,
                description: data.description,
                visibility: data.visibility,
                type: data.type,
                quantity: data.quantity,
                pricePerUnit: data.pricePerUnit,
                creatorId: session.userId,
                verificationStatus: 'VERIFIED', // Admins auto-verify
            },
        });

        return NextResponse.json({ success: true, listing }, { status: 201 });

    } catch (error) {
        console.error('Failed to create listing:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}
