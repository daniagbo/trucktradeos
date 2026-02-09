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

export function getSessionCookieOptions(expiresAt: Date) {
    return {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
        expires: expiresAt,
    }
}

export async function createSessionToken(userId: string, role: string) {
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const token = await encrypt({ userId, role, expiresAt })
    return { token, expiresAt }
}

function parseCookieHeader(header: string | null) {
    if (!header) return new Map<string, string>()
    const map = new Map<string, string>()
    for (const part of header.split(';')) {
        const [rawKey, ...rawValParts] = part.trim().split('=')
        if (!rawKey) continue
        const rawVal = rawValParts.join('=')
        if (!rawVal) continue
        map.set(rawKey, decodeURIComponent(rawVal))
    }
    return map
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
    const { token, expiresAt } = await createSessionToken(userId, role)

    const cookieStore = await cookies()
    cookieStore.set('auth_session', token, getSessionCookieOptions(expiresAt))
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

// Helper for route handlers/tests where `next/headers` cookies() is not available.
export async function verifySessionFromRequest(request: Request) {
    const cookieHeader = request.headers.get('cookie')
    const cookiesMap = parseCookieHeader(cookieHeader)
    const token = cookiesMap.get('auth_session')
    const session = await decrypt(token)
    if (!session?.userId) return null
    return { isAuth: true, userId: session.userId, role: session.role }
}
