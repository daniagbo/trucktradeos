import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import ListingsTable from '@/components/admin/listings-table';
import { ClipboardList, PlusCircle } from 'lucide-react';

export default async function AdminListingsPage() {
  const session = await verifySession();

  if (!session || (session.role !== 'admin' && session.role !== 'ADMIN')) {
    redirect('/login?next=/admin/listings');
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <section className="mb-6 rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-7 text-white md:p-9">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              <ClipboardList className="h-4 w-4" />
              Admin inventory
            </div>
            <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Manage listings</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
              Create, edit, and monitor all equipment inventory records.
            </p>
          </div>
          <Link href="/admin/listings/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-slate-900">
            <PlusCircle className="h-4 w-4" />
            New listing
          </Link>
        </div>
      </section>
      <ListingsTable />
    </div>
  );
}
