import { createSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import { loginSchema } from '@/lib/auth/validation'
import { verifyPassword } from '@/lib/auth/password'
import { db } from '@/lib/db'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input with Zod
        const validationResult = loginSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { email, password } = validationResult.data

        // Find user by email (case-insensitive)
        const user = await db.user.findUnique({
            where: { email }
        })

        if (!user) {
            // Return generic error to prevent email enumeration
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        // Verify password with bcrypt
        const isValidPassword = await verifyPassword(password, user.passwordHash)

        if (!isValidPassword) {
            return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 })
        }

        // Create secure session
        await createSession(user.id, user.role)

        // Return user data (exclude sensitive fields)
        const { passwordHash, ...safeUser } = user

        return NextResponse.json({ success: true, user: safeUser })
    } catch (error) {
        console.error('Login error:', error)
        return NextResponse.json({ message: 'Login failed' }, { status: 500 })
    }
}
