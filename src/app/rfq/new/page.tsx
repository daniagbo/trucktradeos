'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ClipboardCheck, FileSearch, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useListings } from '@/hooks/use-listings';
import RfqWizard from '@/components/rfq/rfq-wizard';

function NewRfqContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const listingId = searchParams.get('listingId');
  const { getListing, loading: listingsLoading } = useListings();

  const listing = listingId ? getListing(listingId) : undefined;
  const loading = authLoading || (listingId && listingsLoading);

  useEffect(() => {
    if (!loading && !user) {
      const redirectUrl = listingId ? `/rfq/new?listingId=${listingId}` : '/rfq/new';
      router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
  }, [user, loading, router, listingId]);

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-4xl">
        <Skeleton className="mb-4 h-28 w-full rounded-2xl" />
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    );
  }

  return <RfqWizard listing={listing} />;
}

export default function NewRfqPage() {
  return (
    <div className="container mx-auto px-4 py-10">
      <section className="rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-7 text-white md:p-9">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <FileSearch className="h-4 w-4" />
          Sourcing workflow
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Create sourcing request</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
          Share specs, delivery needs, and budget range. Our team will return qualified options through the RFQ pipeline.
        </p>
        <div className="mt-6 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <ClipboardCheck className="mr-2 inline h-4 w-4" />
            3-step guided form
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <Truck className="mr-2 inline h-4 w-4" />
            Supports single and fleet orders
          </div>
          <div className="rounded-xl bg-white/10 px-3 py-2">
            <FileSearch className="mr-2 inline h-4 w-4" />
            Real-time RFQ tracking after submit
          </div>
        </div>
      </section>

      <div className="mt-6">
        <Suspense
          fallback={
            <div className="mx-auto max-w-4xl">
              <Skeleton className="mb-4 h-28 w-full rounded-2xl" />
              <Skeleton className="h-[520px] w-full rounded-2xl" />
            </div>
          }
        >
          <NewRfqContent />
        </Suspense>
      </div>
    </div>
  );
}
