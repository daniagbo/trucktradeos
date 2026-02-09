import Link from 'next/link';
import { BadgeCheck, FileText, Handshake, Ship, Warehouse } from 'lucide-react';

const steps = [
  {
    title: 'Share requirements',
    description: 'Submit quantity, budget, region and delivery timing through the RFQ wizard.',
    icon: FileText,
  },
  {
    title: 'Receive curated offers',
    description: 'Our team compiles multi-unit options from verified suppliers.',
    icon: Warehouse,
  },
  {
    title: 'Close with confidence',
    description: 'Track messaging, accept offers, and coordinate export documentation.',
    icon: Handshake,
  },
];

export default function FleetSourceBulkSourcingPage() {
  return (
    <div className="container mx-auto px-4 py-10 md:py-14">
      <section className="rounded-3xl border border-border bg-gradient-to-br from-slate-900 via-slate-800 to-sky-900 p-8 text-white md:p-12">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <Ship className="h-4 w-4" />
            Bulk sourcing desk
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight md:text-5xl">
            Fleet renewal and lot procurement, managed end-to-end
          </h1>
          <p className="mt-4 text-base text-slate-200 md:text-lg">
            Built for buyers sourcing 20+ units. Keep one workflow from request intake to execution.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/rfq/new"
              className="inline-flex h-12 items-center justify-center rounded-xl bg-white px-6 font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Submit bulk RFQ
            </Link>
            <Link
              href="/dashboard/rfqs"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/30 px-6 font-semibold text-white transition hover:bg-white/10"
            >
              Track existing requests
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10 grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <div key={step.title} className="rounded-2xl border border-border bg-card p-6">
            <step.icon className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-sky-50 p-6 md:p-8">
        <h3 className="text-xl font-bold text-slate-900">What makes this workflow production-ready</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {[
            'Role-aware access (buyer/admin)',
            'RFQ status timeline and event tracking',
            'Offer versions and acceptance flow',
            'Centralized message thread per request',
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-sm text-slate-700">
              <BadgeCheck className="h-4 w-4 text-sky-700" />
              {item}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
