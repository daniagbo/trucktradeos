import { createSessionToken, getSessionCookieOptions } from '@/lib/session'
import { NextResponse } from 'next/server'
import { loginSchema } from '@/lib/auth/validation'
import { verifyPassword } from '@/lib/auth/password'
import { db } from '@/lib/db'
import { apiError, apiValidationError } from '@/lib/api/errors'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input with Zod
        const validationResult = loginSchema.safeParse(body)
        if (!validationResult.success) {
            return apiValidationError(validationResult.error)
        }

        const { email, password } = validationResult.data

        // Find user by email (case-insensitive)
        const user = await db.user.findUnique({
            where: { email }
        })

        if (!user) {
            // Return generic error to prevent email enumeration
            return apiError(401, 'Invalid credentials')
        }

        // Verify password with bcrypt
        const isValidPassword = await verifyPassword(password, user.passwordHash)

        if (!isValidPassword) {
            return apiError(401, 'Invalid credentials')
        }

        // Create secure session (route-handler safe: sets cookie on response).
        const { token, expiresAt } = await createSessionToken(user.id, user.role)

        // Return user data (exclude sensitive fields)
        const { passwordHash, ...safeUser } = user

        const response = NextResponse.json({ success: true, user: safeUser })
        response.cookies.set('auth_session', token, getSessionCookieOptions(expiresAt))
        return response
    } catch (error) {
        console.error('Login error:', error)
        return apiError(500, 'Login failed')
    }
}
