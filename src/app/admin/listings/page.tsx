'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import Link from 'next/link';
import ListingsTable from '@/components/admin/listings-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminListingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login?redirect=/admin/listings');
    }
  }, [user, loading, router]);

  if (loading || !user || user.role !== 'admin') {
    return (
        <div className="container py-8">
            <div className="flex justify-between items-center mb-6">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-96 w-full" />
        </div>
    );
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
