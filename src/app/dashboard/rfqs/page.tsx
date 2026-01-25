'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FileText, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { useRfqs } from '@/hooks/use-rfqs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RFQ, RFQStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const statusColors: Record<RFQStatus, string> = {
    Received: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'In progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Offer sent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Pending execution': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Won: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    Lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const RfqCard = ({ rfq }: { rfq: RFQ }) => (
    <Card>
        <CardHeader>
            <div className="flex justify-between items-start">
                <CardTitle className="text-lg font-semibold leading-snug">Request for {rfq.category}</CardTitle>
                <Badge variant="outline" className={statusColors[rfq.status]}>{rfq.status}</Badge>
            </div>
            <CardDescription>
                RFQ ID: {rfq.id} &bull; {formatDistanceToNow(new Date(rfq.createdAt), { addSuffix: true })}
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground line-clamp-2">{rfq.keySpecs}</p>
        </CardContent>
        <CardFooter>
            <Button asChild variant="secondary" className="w-full">
                <Link href={`/dashboard/rfqs/${rfq.id}`}>View Details</Link>
            </Button>
        </CardFooter>
    </Card>
);


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
  const userRfqs = user ? getRfqsForUser(user.id) : [];

  return (
    <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h1 className="font-headline text-3xl font-bold tracking-tight">My Sourcing Requests</h1>
                <p className="text-muted-foreground">Track and manage your RFQs.</p>
            </div>
            <Button asChild>
                <Link href="/rfq/new">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Request
                </Link>
            </Button>
        </div>

        {loading ? (
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
                <Skeleton className="h-64" />
            </div>
        ) : userRfqs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {userRfqs.map(rfq => <RfqCard key={rfq.id} rfq={rfq} />)}
            </div>
        ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">No sourcing requests yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Create a new request to get help from our sourcing team.
                </p>
                <div className="mt-6">
                    <Button asChild>
                        <Link href="/rfq/new">Create Sourcing Request</Link>
                    </Button>
                </div>
            </div>
        )}
    </div>
  );
}
