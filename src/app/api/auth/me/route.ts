import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifySessionFromRequest } from '@/lib/session'

export async function GET(request: Request) {
    const session = await verifySessionFromRequest(request)

    if (!session || !session.userId) {
        return NextResponse.json({ user: null })
    }

    // Fetch real user from DB
    const user = await db.user.findUnique({
        where: { id: session.userId },
        include: {
            organization: {
                select: { id: true, name: true, slug: true }
            }
        }
    })

    if (!user) {
        return NextResponse.json({ user: null })
    }

    // Return safe user object
    const { passwordHash, ...safeUser } = user
    return NextResponse.json({
        user: {
            ...safeUser,
            createdAt: safeUser.createdAt.toISOString(),
            updatedAt: safeUser.updatedAt.toISOString()
        }
    })
}
