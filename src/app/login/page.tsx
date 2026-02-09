import Link from 'next/link';
import { Suspense } from 'react';
import { CheckCircle2, Shield, Sparkles } from 'lucide-react';
import LoginForm from '@/components/auth/login-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-2">
        <aside className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <Sparkles className="h-4 w-4" />
              FleetSource
            </div>
            <h2 className="mt-5 text-4xl font-extrabold leading-tight">Welcome back to your sourcing workspace</h2>
            <p className="mt-4 text-sm text-slate-200">
              Continue where you left off, track open deals, and move RFQs through execution.
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2 text-slate-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              RFQ timeline and offer updates in one place
            </p>
            <p className="flex items-center gap-2 text-slate-100">
              <Shield className="h-4 w-4 text-sky-300" />
              Secure session-based authentication
            </p>
          </div>
        </aside>

        <main className="p-6 md:p-10">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-2 text-sm text-slate-600">Use your account to access dashboard, inventory, and request workflows.</p>

          <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
            Demo: click <strong>Use demo credentials</strong> then sign in.
          </div>

          <div className="mt-6">
            <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
              <LoginForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-primary hover:underline">
              Create one
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
