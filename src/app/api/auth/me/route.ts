import { verifySession } from '@/lib/session'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
    const session = await verifySession()

    if (!session || !session.userId) {
        return NextResponse.json({ user: null })
    }

    // Fetch real user from DB
    const user = await db.user.findUnique({
        where: { id: session.userId }
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

    // Fallback for newly registered users during audit/session
    // In a real app, this would come from a DB
    const syntheticUser = {
        id: session.userId,
        email: 'registered-user@example.com', // Placeholder since email isn't in session payload
        name: 'New User',
        role: session.role,
        createdAt: new Date().toISOString()
    }

    return NextResponse.json({ user: syntheticUser })
}
