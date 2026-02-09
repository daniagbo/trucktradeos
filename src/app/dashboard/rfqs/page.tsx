'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { ClipboardList, FileSearch, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRfqs } from '@/hooks/use-rfqs';
import { Skeleton } from '@/components/ui/skeleton';
import type { RFQStatus } from '@/lib/types';

const statusClasses: Record<RFQStatus, string> = {
  Received: 'bg-amber-100 text-amber-800',
  'In progress': 'bg-blue-100 text-blue-800',
  'Offer sent': 'bg-emerald-100 text-emerald-800',
  'Pending execution': 'bg-violet-100 text-violet-800',
  Won: 'bg-teal-100 text-teal-800',
  Lost: 'bg-rose-100 text-rose-800',
};

export default function MyRfqsPage() {
  const { user, loading: authLoading } = useAuth();
  const { getRfqsForUser, loading: rfqsLoading } = useRfqs();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/dashboard/rfqs');
    }
  }, [user, authLoading, router]);

  const loading = authLoading || rfqsLoading;
  const userRfqs = useMemo(() => (user ? getRfqsForUser(user.id) : []), [user, getRfqsForUser]);

  const stats = useMemo(() => {
    const active = userRfqs.filter((rfq) => !['Won', 'Lost'].includes(rfq.status)).length;
    const offers = userRfqs.filter((rfq) => rfq.status === 'Offer sent').length;
    return { total: userRfqs.length, active, offers };
  }, [userRfqs]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="mb-4 h-28 w-full rounded-2xl" />
        <Skeleton className="h-[460px] w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <section className="rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-7 text-white md:p-9">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <ClipboardList className="h-4 w-4" />
          RFQ monitor
        </div>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">My sourcing requests</h1>
            <p className="mt-2 text-sm text-slate-200">Track status, open offers, and keep negotiations moving.</p>
          </div>
          <Link href="/rfq/new" className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-slate-900">
            <Plus className="mr-2 h-4 w-4" />
            New request
          </Link>
        </div>
        <div className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-white/10 px-4 py-3"><strong>{stats.total}</strong> total requests</div>
          <div className="rounded-xl bg-white/10 px-4 py-3"><strong>{stats.active}</strong> active in pipeline</div>
          <div className="rounded-xl bg-white/10 px-4 py-3"><strong>{stats.offers}</strong> with offers sent</div>
        </div>
      </section>

      <section className="mt-6">
        {userRfqs.length > 0 ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">RFQ</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Destination</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {userRfqs.map((rfq) => (
                    <tr key={rfq.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{rfq.id.slice(0, 12)}...</p>
                        <p className="line-clamp-1 text-xs text-slate-500">{rfq.keySpecs}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{rfq.category}</td>
                      <td className="px-4 py-3 text-slate-700">{rfq.deliveryCountry}</td>
                      <td className="px-4 py-3 text-slate-700">{formatDistanceToNow(new Date(rfq.createdAt), { addSuffix: true })}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClasses[rfq.status]}`}>{rfq.status}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/dashboard/rfqs/${rfq.id}`} className="text-sm font-semibold text-primary hover:underline">
                          View details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-14 text-center">
            <FileSearch className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-xl font-bold text-slate-900">No sourcing requests yet</h2>
            <p className="mt-2 text-sm text-slate-600">Create your first RFQ and start receiving qualified offers.</p>
            <Link href="/rfq/new" className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white">
              Create request
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
