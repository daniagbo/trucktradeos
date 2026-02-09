import Link from 'next/link';
import { Suspense } from 'react';
import { Building2, CheckCircle2, UserRound } from 'lucide-react';
import RegisterForm from '@/components/auth/register-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function RegisterPage() {
  return (
    <div className="container mx-auto px-4 py-10 md:py-16">
      <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-sm lg:grid-cols-2">
        <aside className="hidden bg-gradient-to-br from-slate-900 via-slate-800 to-cyan-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              Buyer onboarding
            </div>
            <h2 className="mt-5 text-4xl font-extrabold leading-tight">Create your FleetSource account</h2>
            <p className="mt-4 text-sm text-slate-200">
              Register once, then manage sourcing requests, offers, and supplier communication in one flow.
            </p>
          </div>
          <div className="space-y-3 text-sm text-slate-100">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Account-aware experience for individual and company buyers
            </p>
            <p className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-sky-300" />
              Company profile fields ready for procurement teams
            </p>
          </div>
        </aside>

        <main className="p-6 md:p-10">
          <h1 className="font-headline text-3xl font-bold tracking-tight text-slate-900">Create account</h1>
          <p className="mt-2 text-sm text-slate-600">Set up your buyer identity and unlock full sourcing features.</p>
          <div className="mt-6 rounded-xl border border-border bg-muted/50 px-4 py-3 text-sm text-slate-700">
            <UserRound className="mr-2 inline h-4 w-4 text-primary" />
            Choose <strong>Company</strong> if you purchase as a business entity.
          </div>

          <div className="mt-6">
            <Suspense fallback={<Skeleton className="h-[520px] w-full rounded-2xl" />}>
              <RegisterForm />
            </Suspense>
          </div>

          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </main>
      </div>
    </div>
  );
}
