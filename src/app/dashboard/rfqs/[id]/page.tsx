'use client';
import { useEffect } from 'react';
import { useRfqs } from '@/hooks/use-rfqs';
import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import MessagingThread from '@/components/rfq/messaging-thread';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { RFQStatus } from '@/lib/types';

const statusColors: Record<RFQStatus, string> = {
    Received: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'In progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Offer sent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    Closed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

const StatusTimeline = ({ status, createdAt }: { status: RFQStatus, createdAt: string }) => {
    const statuses: RFQStatus[] = ['Received', 'In progress', 'Offer sent', 'Closed'];
    const currentIndex = statuses.indexOf(status);

    return (
        <div className="flex justify-between items-center">
            {statuses.map((s, i) => (
                <div key={s} className="flex-1 text-center">
                    <div className="flex items-center justify-center">
                         {i > 0 && <div className={`flex-1 h-1 ${i <= currentIndex ? 'bg-primary' : 'bg-border'}`}></div>}
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center ${i <= currentIndex ? 'bg-primary text-primary-foreground' : 'bg-border'}`}>
                             {i < currentIndex ? '✔' : i + 1}
                         </div>
                        {i < statuses.length - 1 && <div className={`flex-1 h-1 ${i < currentIndex ? 'bg-primary' : 'bg-border'}`}></div>}
                    </div>
                    <p className={`text-xs mt-2 ${i <= currentIndex ? 'font-semibold' : 'text-muted-foreground'}`}>{s}</p>
                </div>
            ))}
        </div>
    );
};


export default function RfqDetailPage() {
    const params = useParams();
    const rfqId = params.id as string;
    const { getRfqById, loading: rfqLoading } = useRfqs();
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();

    const rfq = getRfqById(rfqId);
    const loading = rfqLoading || authLoading;

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push(`/login?redirect=/dashboard/rfqs/${rfqId}`);
            } else if (!rfq || rfq.userId !== user.id) {
                router.push('/dashboard/rfqs');
            }
        }
    }, [loading, user, rfq, rfqId, router]);

    if (loading || !rfq) {
        return <div className="container py-8"><Skeleton className="h-screen w-full" /></div>
    }

    return (
        <div className="container py-8">
            <Link href="/dashboard/rfqs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to all requests
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversation</CardTitle>
                            <CardDescription>Chat with our sourcing team about your request.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <MessagingThread rfqId={rfq.id} />
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Details</CardTitle>
                            <div className="flex justify-between items-center">
                                <CardDescription>ID: {rfq.id}</CardDescription>
                                <Badge variant="outline" className={statusColors[rfq.status]}>{rfq.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <StatusTimeline status={rfq.status} createdAt={rfq.createdAt} />
                             <div className="border-t pt-4 space-y-2">
                                <p><strong>Category:</strong> {rfq.category}</p>
                                <p><strong>Key Specs:</strong> {rfq.keySpecs}</p>
                                {rfq.preferredBrands && <p><strong>Brands:</strong> {rfq.preferredBrands}</p>}
                                {(rfq.yearMin || rfq.yearMax) && <p><strong>Year:</strong> {rfq.yearMin || '?'} - {rfq.yearMax || '?'}</p>}
                                {(rfq.budgetMin || rfq.budgetMax) && <p><strong>Budget:</strong> ${rfq.budgetMin?.toLocaleString() || '?'} - ${rfq.budgetMax?.toLocaleString() || '?'}</p>}
                                <p><strong>Delivery:</strong> {rfq.deliveryCountry}</p>
                                {rfq.pickupDeadline && <p><strong>Deadline:</strong> {format(new Date(rfq.pickupDeadline), "PPP")}</p>}
                                <p><strong>Urgency:</strong> {rfq.urgency}</p>
                                <p><strong>Condition:</strong> {rfq.conditionTolerance}</p>
                                {rfq.requiredDocuments.length > 0 && <p><strong>Documents:</strong> {rfq.requiredDocuments.join(', ')}</p>}
                                {rfq.notes && <p><strong>Notes:</strong> {rfq.notes}</p>}
                             </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
