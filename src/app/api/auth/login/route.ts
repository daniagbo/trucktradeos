import { createSession } from '@/lib/session'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { loginSchema } from '@/lib/auth/validation'
import { verifyPassword } from '@/lib/auth/password'
import { db } from '@/lib/db'
import { checkRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
    // Rate Limiting (5 attempts per minute)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
    const limitResult = checkRateLimit(ip, 5, 60 * 1000)

    if (!limitResult.success) {
        return NextResponse.json(
            { message: 'Too many login attempts. Please try again later.' },
            {
                status: 429,
                headers: {
                    'Retry-After': Math.ceil((limitResult.reset - Date.now()) / 1000).toString()
                }
            }
        )
    }

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
