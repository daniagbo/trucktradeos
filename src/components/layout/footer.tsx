import Link from 'next/link';
import { Logo } from '@/components/icons';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Logo className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">FleetSource</span>
            </Link>
            <p className="max-w-md text-sm leading-6 text-slate-600">
              Built for equipment sourcing teams that need transparent listings, tracked RFQs, and reliable cross-border execution.
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Platform</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/listings" className="text-slate-600 transition hover:text-primary">Inventory</Link>
              <Link href="/bulk-sourcing" className="text-slate-600 transition hover:text-primary">Bulk Sourcing</Link>
              <Link href="/dashboard" className="text-slate-600 transition hover:text-primary">Dashboard</Link>
              <Link href="/dashboard/rfqs" className="text-slate-600 transition hover:text-primary">My Requests</Link>
            </nav>
          </div>
          <div>
            <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-500">Account</h4>
            <nav className="flex flex-col gap-2 text-sm">
              <Link href="/login" className="text-slate-600 transition hover:text-primary">Sign in</Link>
              <Link href="/register" className="text-slate-600 transition hover:text-primary">Register</Link>
              <Link href="/profile" className="text-slate-600 transition hover:text-primary">Profile</Link>
            </nav>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-sm text-slate-500 md:flex-row">
          <div>© {new Date().getFullYear()} FleetSource. All rights reserved.</div>
          <div className="text-xs uppercase tracking-wide text-slate-400">Built with Next.js + Prisma</div>
        </div>
      </div>
    </footer>
  );
}
