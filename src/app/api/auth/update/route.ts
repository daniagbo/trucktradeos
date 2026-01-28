import { verifySession } from '@/lib/session'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { AccountType, Prisma } from '@prisma/client'
import { z } from 'zod'

const updateProfileSchema = z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    country: z.string().min(2).optional(),
    accountType: z.enum(["individual", "company", "INDIVIDUAL", "COMPANY"]).optional(),
    companyName: z.string().optional(),
    vat: z.string().optional(),
});

export async function PUT(request: Request) {
    const session = await verifySession()

    if (!session || !session.userId) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await request.json()

        const validationResult = updateProfileSchema.safeParse(body);
        if (!validationResult.success) {
             return NextResponse.json(
                { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { name, phone, country, accountType, companyName, vat } = validationResult.data;

        const updateData: Prisma.UserUpdateInput = {};
        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (country !== undefined) updateData.country = country;
        if (companyName !== undefined) updateData.companyName = companyName;
        if (vat !== undefined) updateData.vat = vat;
        if (accountType !== undefined) {
             updateData.accountType = accountType.toUpperCase() as AccountType;
        }

        const updatedUser = await db.user.update({
            where: { id: session.userId },
            data: updateData
        })

        // Return safe user object
        const { passwordHash, ...safeUser } = updatedUser
        return NextResponse.json({
            user: {
                ...safeUser,
                createdAt: safeUser.createdAt.toISOString(),
                updatedAt: safeUser.updatedAt.toISOString()
            },
            message: 'Profile updated successfully'
        })

    } catch (error) {
        console.error('Update profile error:', error)
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
    }
}
