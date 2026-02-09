'use client';

import Link from 'next/link';
import { ArrowRight, CheckCircle2, Globe, Shield, Sparkles } from 'lucide-react';
import { useListings } from '@/hooks/use-listings';
import { useAuth } from '@/hooks/use-auth';
import ListingCard from '@/components/listings/listing-card';

export default function FleetSourceHomePage() {
  const { listings, loading } = useListings();
  const { user } = useAuth();

  const featured = listings.slice(0, 3);

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-sky-50 to-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.14),transparent_50%)]" />
        <div className="container relative mx-auto px-4 py-20 md:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wide text-sky-700">
              <Sparkles className="h-4 w-4" />
              Verified B2B Equipment Marketplace
            </div>
            <h1 className="text-balance text-4xl font-extrabold tracking-tight text-slate-900 md:text-5xl lg:text-6xl">
              Source trucks and heavy equipment with real supplier data
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 md:text-lg">
              From single units to fleet lots, FleetSource gives procurement teams a dependable workflow from discovery to signed deal.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/listings"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 font-semibold text-white transition hover:bg-primary/90"
              >
                Explore inventory
              </Link>
              <Link
                href={user ? '/rfq/new' : '/login?redirect=%2Frfq%2Fnew'}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-white px-6 font-semibold text-slate-900 transition hover:bg-slate-50"
              >
                Start sourcing request
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-3 md:grid-cols-3">
            {[
              { icon: Shield, label: 'Verified sellers and listings' },
              { icon: Globe, label: 'Cross-border export support' },
              { icon: CheckCircle2, label: 'RFQ and offer workflow included' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-border bg-white/80 px-4 py-3 text-sm font-medium text-slate-700">
                <item.icon className="mr-2 inline h-4 w-4 text-primary" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">Featured inventory</h2>
            <p className="mt-2 text-sm text-slate-600">Live listings from the backend, not static mock cards.</p>
          </div>
          <Link href="/listings" className="hidden text-sm font-semibold text-primary hover:underline md:inline">
            View all listings
          </Link>
        </div>

        {loading ? (
          <div className="text-sm text-muted-foreground">Loading listings...</div>
        ) : featured.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} isMember={Boolean(user)} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">No listings yet. Seed data or create listings from admin.</p>
          </div>
        )}
      </section>
    </div>
  );
}
