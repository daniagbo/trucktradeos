'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FileText, LayoutDashboard, Package, SearchCheck, UserCircle2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRfqs } from '@/hooks/use-rfqs';
import { useListings } from '@/hooks/use-listings';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="fx-lift rounded-2xl border border-border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { rfqs, loading: rfqsLoading } = useRfqs();
  const { listings, loading: listingsLoading } = useListings();
  const router = useRouter();
  const [onboarding, setOnboarding] = useState<{
    completionRate: number;
    items: Array<{ key: string; label: string; done: boolean }>;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    let active = true;
    const loadOnboarding = async () => {
      if (!user) return;
      try {
        const res = await fetch('/api/auth/onboarding-checklist', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setOnboarding(data);
      } catch (error) {
        console.error('Failed to load onboarding checklist:', error);
      }
    };
    void loadOnboarding();
    return () => {
      active = false;
    };
  }, [user]);

  const loading = authLoading || rfqsLoading || listingsLoading;

  const stats = useMemo(() => {
    if (!user) {
      return {
        myRfqs: 0,
        activeRfqs: 0,
        liveListings: 0,
      };
    }
    const myRfqs = rfqs.filter((rfq) => rfq.userId === user.id);
    return {
      myRfqs: myRfqs.length,
      activeRfqs: myRfqs.filter((rfq) => !['Won', 'Lost'].includes(rfq.status)).length,
      liveListings: listings.filter((listing) => listing.availabilityStatus !== 'sold').length,
    };
  }, [user, rfqs, listings]);

  if (loading || !user) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="mb-4 h-10 w-64" />
        <Skeleton className="mb-8 h-5 w-96" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-7 text-white md:p-10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <LayoutDashboard className="h-4 w-4" />
          Control center
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
          Welcome back, {user.name.split(' ')[0]}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
          Monitor sourcing performance, jump into active requests, and keep your buyer profile complete.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <StatCard label="My RFQs" value={String(stats.myRfqs)} hint="Total requests submitted" />
        <StatCard label="Active RFQs" value={String(stats.activeRfqs)} hint="Awaiting action or offer" />
        <StatCard label="Live Listings" value={String(stats.liveListings)} hint="Currently available inventory" />
      </div>

      {onboarding && onboarding.completionRate < 100 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-bold text-slate-900">First-session checklist</h2>
            <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
              {onboarding.completionRate}% complete
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {onboarding.items.map((item) => (
              <p key={item.key} className={`text-sm ${item.done ? 'text-emerald-700' : 'text-slate-600'}`}>
                {item.done ? '✓' : '○'} {item.label}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { href: '/rfq/new', label: 'Create RFQ', icon: SearchCheck, copy: 'Start a new sourcing request' },
          { href: '/dashboard/rfqs', label: 'My Requests', icon: FileText, copy: 'Review timelines and offers' },
          { href: '/listings', label: 'Browse Listings', icon: Package, copy: 'Find available equipment' },
          { href: '/profile', label: 'Profile', icon: UserCircle2, copy: 'Update company details' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="fx-lift rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40 hover:shadow-sm"
          >
            <item.icon className="h-5 w-5 text-primary" />
            <h2 className="mt-3 text-base font-bold text-slate-900">{item.label}</h2>
            <p className="mt-1 text-sm text-slate-600">{item.copy}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
