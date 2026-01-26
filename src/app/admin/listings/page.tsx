import { verifySession } from '@/lib/session';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import ListingsTable from '@/components/admin/listings-table';

export default async function AdminListingsPage() {
  const session = await verifySession();

  if (!session || session.role !== 'admin') {
    // Stealth mode or redirect to login
    redirect('/login?next=/admin/listings');
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Manage Listings</h1>
          <p className="text-muted-foreground">Create, edit, and manage all inventory.</p>
        </div>
        <Button asChild>
          <Link href="/admin/listings/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            New Listing
          </Link>
        </Button>
      </div>
      <ListingsTable />
    </div>
  );
}
