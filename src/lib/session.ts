import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// In production, this MUST be a long, random secret environment variable
const secretKey = process.env.SESSION_SECRET
if (!secretKey && process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET environment variable is required in production')
}
const encodedKey = new TextEncoder().encode(secretKey || 'development_secret_key_change_me_in_prod_please_123456789')

type SessionPayload = {
    userId: string
    role: string
    expiresAt: Date
}

export async function encrypt(payload: SessionPayload) {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(encodedKey)
}

export async function decrypt(session: string | undefined = '') {
    try {
        const { payload } = await jwtVerify(session, encodedKey, {
            algorithms: ['HS256'],
        })
        return payload as unknown as SessionPayload
    } catch (error) {
        return null
    }
}

export async function createSession(userId: string, role: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const session = await encrypt({ userId, role, expiresAt })

    const cookieStore = await cookies()
    cookieStore.set('auth_session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Consistent secure flag
        sameSite: 'lax', // Better for UX (navigation from external sites)
        path: '/',
        expires: expiresAt,
    })
}

export async function deleteSession() {
    const cookieStore = await cookies()
    cookieStore.delete('auth_session')
}

export async function verifySession() {
    const cookieStore = await cookies()
    const cookie = cookieStore.get('auth_session')?.value
    const session = await decrypt(cookie)

    if (!session?.userId) {
        return null
    }

    return { isAuth: true, userId: session.userId, role: session.role }
}
