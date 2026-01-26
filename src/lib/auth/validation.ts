import { z } from "zod";

/**
 * Password Policy:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character (!@#$%^&*)"
    );

/**
 * Relaxed password policy for development/demo
 * Minimum 6 characters, no special requirements
 */
export const passwordSchemaRelaxed = z
    .string()
    .min(6, "Password must be at least 6 characters");

/**
 * Email validation schema
 */
export const emailSchema = z
    .string()
    .email("Invalid email address")
    .min(1, "Email is required")
    .transform((email) => email.toLowerCase().trim());

/**
 * User registration schema
 */
export const registerSchema = z.object({
    email: emailSchema,
    password: passwordSchemaRelaxed, // Use relaxed for demo, switch to passwordSchema for production
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional(),
    country: z.string().min(2, "Country is required"),
    accountType: z.enum(["individual", "company"]).default("individual"),
    companyName: z.string().optional(),
    vat: z.string().optional(),
});

/**
 * Login schema
 */
export const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, "Password is required"),
});

/**
 * Password change schema
 */
export const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: passwordSchema,
        confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

// Type exports
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
