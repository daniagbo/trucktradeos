import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

export function apiError(status: number, message: string, extra?: Record<string, unknown>) {
  return NextResponse.json(
    {
      message,
      ...(extra || {}),
    },
    { status }
  );
}

export function apiValidationError(error: ZodError) {
  return apiError(400, 'Invalid input', { errors: error.flatten().fieldErrors });
}

