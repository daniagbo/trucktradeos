import { NextResponse } from 'next/server'
import { createSession } from '@/lib/session'
import { registerSchema } from '@/lib/auth/validation'
import { hashPassword } from '@/lib/auth/password'
import { db } from '@/lib/db'
import { AccountType } from '@prisma/client'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input with Zod
        const validationResult = registerSchema.safeParse(body)
        if (!validationResult.success) {
            return NextResponse.json(
                { message: 'Invalid input', errors: validationResult.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { email, password, name, phone, country, accountType, companyName, vat } = validationResult.data

        // Check if user already exists
        const existingUser = await db.user.findUnique({ where: { email } })
        if (existingUser) {
            return NextResponse.json({ message: 'Email already registered' }, { status: 409 })
        }

        // Hash the password
        const passwordHash = await hashPassword(password)

        // Create user in database
        const user = await db.user.create({
            data: {
                email,
                passwordHash,
                name,
                phone,
                country,
                accountType: accountType.toUpperCase() as AccountType,
                companyName,
                vat,
                role: 'MEMBER' // Default role
            }
        })

        // Create secure session immediately upon registration
        await createSession(user.id, user.role)

        return NextResponse.json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                accountType: user.accountType,
                country: user.country,
                createdAt: user.createdAt.toISOString()
            }
        })
    } catch (error) {
        console.error('Registration error:', error)
        return NextResponse.json({ message: 'Registration failed' }, { status: 500 })
    }
}
