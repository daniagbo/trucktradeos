'use client';

import { useRfqs } from '@/hooks/use-rfqs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Inbox } from 'lucide-react'; // Added Inbox icon for empty state
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { RFQ, RFQStatus } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { RfqsToolbar } from './rfqs-toolbar';
import { Skeleton } from '@/components/ui/skeleton';

const statusColors: Record<RFQStatus, string> = {
    Received: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'In progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Offer sent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Pending execution': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Won: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    Lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function AdminRfqsClient() {
    const { rfqs, loading } = useRfqs();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const filteredRfqs = useMemo(() => {
        if (!rfqs) return [];

        let result = [...rfqs];

        // 1. Status Filter
        const statusParam = searchParams.get('status');
        if (statusParam) {
            const statuses = statusParam.split(',');
            result = result.filter(r => statuses.includes(r.status));
        } else {
            // Default: Received + In progress
            // Unless specifically cleared?
            // Strategy: "No params" = Default. "Clear All" -> removes params -> Default.
            // If user wants ALL, they must select all.
            // Wait, previous thought: "Clear All" = removes params.
            // If "No params" implies default filter, then "Clear All" effectively resets to default.
            // This is acceptable behavior for an inbox.
            result = result.filter(r => ['Received', 'In progress'].includes(r.status));
        }

        // 2. Category Filter
        const categoryParam = searchParams.get('category');
        if (categoryParam) {
             const categories = categoryParam.split(',');
             result = result.filter(r => categories.includes(r.category));
        }

        // 3. Urgency Filter
        const urgencyParam = searchParams.get('urgency');
        if (urgencyParam) {
            result = result.filter(r => r.urgency === urgencyParam);
        }

        // 4. Country Filter
        const countryParam = searchParams.get('country');
        if (countryParam) {
            result = result.filter(r => r.deliveryCountry === countryParam);
        }

        // 5. Search
        const query = searchParams.get('q')?.toLowerCase();
        if (query) {
            result = result.filter(r =>
                r.id.toLowerCase().includes(query) ||
                r.deliveryCountry.toLowerCase().includes(query) ||
                // r.userId.toLowerCase().includes(query) || // userId is not user friendly
                (r.listingId && r.listingId.toLowerCase().includes(query))
            );
        }

        // 6. Sort
        const sortParam = searchParams.get('sort');
        if (sortParam === 'oldest') {
             result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
             // Default Newest
             result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }

        return result;
    }, [rfqs, searchParams]);

    // Derived lists
    const countries = useMemo(() => {
        if (!rfqs) return [];
        return Array.from(new Set(rfqs.map(r => r.deliveryCountry))).sort();
    }, [rfqs]);

    const clearAll = () => {
        router.replace(pathname);
    };

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

            <RfqsToolbar countries={countries} />

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
                        {filteredRfqs.length > 0 ? (
                            filteredRfqs.map((rfq: RFQ) => (
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                                        <Inbox className="h-8 w-8 mb-2 opacity-50" />
                                        <p>No RFQs match your filters.</p>
                                        <Button variant="link" onClick={clearAll} className="px-2 font-normal">
                                            Clear filters
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
                Showing {filteredRfqs.length} of {rfqs.length} total requests
            </div>
        </div>
    );
}
