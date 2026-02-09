import { NextResponse } from 'next/server'
import { createSessionToken, getSessionCookieOptions } from '@/lib/session'
import { registerSchema } from '@/lib/auth/validation'
import { hashPassword } from '@/lib/auth/password'
import { db } from '@/lib/db'
import { AccountType } from '@prisma/client'
import { apiError, apiValidationError } from '@/lib/api/errors'

function slugify(value: string) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
        .slice(0, 48) || 'organization'
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        // Validate input with Zod
        const validationResult = registerSchema.safeParse(body)
        if (!validationResult.success) {
            return apiValidationError(validationResult.error)
        }

        const { email, password, name, phone, country, accountType, companyName, vat } = validationResult.data

        // Check if user already exists
        const existingUser = await db.user.findUnique({ where: { email } })
        if (existingUser) {
            return apiError(409, 'Email already registered')
        }

        // Hash the password
        const passwordHash = await hashPassword(password)

        let organizationId: string | undefined
        const isCompanyAccount = accountType === 'company'

        if (isCompanyAccount) {
            const baseName = (companyName && companyName.trim()) ? companyName.trim() : `${name.trim()} Organization`
            const baseSlug = slugify(baseName)
            const existing = await db.organization.findUnique({ where: { slug: baseSlug }, select: { id: true } })
            const slug = existing ? `${baseSlug}-${Math.random().toString(36).slice(2, 7)}` : baseSlug
            const organization = await db.organization.create({
                data: {
                    name: baseName,
                    slug,
                },
                select: { id: true },
            })
            const newOrganizationId = organization.id
            organizationId = newOrganizationId

            await db.approvalPolicy.createMany({
                data: [
                    {
                        organizationId: newOrganizationId,
                        serviceTier: 'STANDARD',
                        requiredApprovals: 1,
                        approverTeamRole: 'APPROVER',
                        autoAssignEnabled: true,
                        warningThresholdRatio: 1,
                        criticalThresholdRatio: 1.5,
                        active: true,
                    },
                    {
                        organizationId: newOrganizationId,
                        serviceTier: 'PRIORITY',
                        requiredApprovals: 1,
                        approverTeamRole: 'MANAGER',
                        autoAssignEnabled: true,
                        warningThresholdRatio: 1,
                        criticalThresholdRatio: 1.5,
                        active: true,
                    },
                    {
                        organizationId: newOrganizationId,
                        serviceTier: 'ENTERPRISE',
                        requiredApprovals: 2,
                        approverTeamRole: 'OWNER',
                        autoAssignEnabled: true,
                        warningThresholdRatio: 1,
                        criticalThresholdRatio: 1.5,
                        active: true,
                    },
                ],
            })
        }

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
                role: 'MEMBER', // Default role
                teamRole: isCompanyAccount ? 'OWNER' : 'REQUESTER',
                organizationId,
            }
        })

        // Create secure session immediately upon registration (route-handler safe).
        const { token, expiresAt } = await createSessionToken(user.id, user.role)

        const response = NextResponse.json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                teamRole: user.teamRole,
                accountType: user.accountType,
                organizationId: user.organizationId,
                country: user.country,
                createdAt: user.createdAt.toISOString()
            }
        })
        response.cookies.set('auth_session', token, getSessionCookieOptions(expiresAt))
        return response
    } catch (error) {
        console.error('Registration error:', error)
        return apiError(500, 'Registration failed')
    }
}
