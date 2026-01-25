'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useRfqs } from '@/hooks/use-rfqs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RFQ, RFQStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<RFQStatus, string> = {
    Received: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'In progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Offer sent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};


export default function AdminRfqsPage() {
  const { user, loading: authLoading } = useAuth();
  const { rfqs, loading: rfqsLoading } = useRfqs();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login?redirect=/admin/rfqs');
    }
  }, [user, authLoading, router]);
  
  const loading = authLoading || rfqsLoading;
  
  // TODO: Add filtering logic
  const sortedRfqs = [...rfqs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  if (loading) {
      return <div className="container py-8"><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">RFQ Inbox</h1>
                <p className="text-muted-foreground">Manage all incoming sourcing requests.</p>
            </div>
        </div>
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>RFQ ID</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Urgency</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedRfqs.map((rfq: RFQ) => (
                        <TableRow key={rfq.id}>
                            <TableCell className="font-mono text-xs">{rfq.id}</TableCell>
                            <TableCell>{rfq.category}</TableCell>
                            <TableCell>{rfq.deliveryCountry}</TableCell>
                            <TableCell>
                                <Badge variant={rfq.urgency === 'Urgent' ? 'destructive' : 'secondary'}>{rfq.urgency}</Badge>
                            </TableCell>
                            <TableCell>{formatDistanceToNow(new Date(rfq.createdAt), { addSuffix: true })}</TableCell>
                            <TableCell>
                                <Badge variant="outline" className={statusColors[rfq.status]}>{rfq.status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Open menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/admin/rfqs/${rfq.id}`}>View Details</Link>
                                    </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    </div>
  );
}
