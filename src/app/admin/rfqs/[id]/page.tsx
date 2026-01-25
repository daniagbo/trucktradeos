'use client';
import { useEffect, useState } from 'react';
import { useRfqs } from '@/hooks/use-rfqs';
import { useAuth } from '@/hooks/use-auth';
import { useParams, useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import MessagingThread from '@/components/rfq/messaging-thread';
import Link from 'next/link';
import { ArrowLeft, User as UserIcon, FileText, Banknote, Calendar, CheckCircle, Truck, Package } from 'lucide-react';
import { RFQStatus, User, Offer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { mockUsers } from '@/lib/mock-data';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import OfferForm from '@/components/admin/offer-form';
import CloseRfqDialog from '@/components/rfq/close-rfq-dialog';
import DealTimeline from '@/components/rfq/deal-timeline';

const statusColors: Record<RFQStatus, string> = {
    Received: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    'In progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    'Offer sent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    'Pending execution': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    Won: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
    Lost: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const findUserById = (userId: string): User | undefined => {
    return mockUsers.find(u => u.id === userId); // In a real app, this would be a DB call
}

const OfferItem = ({ offer }: { offer: Offer }) => {
    return (
        <div className="border p-4 rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold">{offer.title} <span className="text-sm font-normal text-muted-foreground">(v{offer.versionNumber})</span></h4>
                    <p className="text-sm text-muted-foreground">Sent: {format(new Date(offer.sentAt!), "PPP")}</p>
                </div>
                <Badge variant="outline">{offer.status}</Badge>
            </div>
            <div className="text-sm mt-2 space-y-1">
                {offer.price && <p className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> <strong>Price:</strong> {new Intl.NumberFormat('en-US', { style: 'currency', currency: offer.currency || 'USD' }).format(offer.price)}</p>}
                <p className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> <strong>Valid Until:</strong> {format(new Date(offer.validUntil), "PPP")}</p>
                <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-muted-foreground" /> <strong>Terms:</strong> {offer.terms}</p>
                 <p className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> <strong>Availability:</strong> {offer.availabilityText}</p>
            </div>
        </div>
    )
}

export default function AdminRfqWorkspacePage() {
    const params = useParams();
    const rfqId = params.id as string;
    const { getRfqById, updateRfqStatus, updateRfqInternalNotes, getOffersForRfq, loading: rfqLoading } = useRfqs();
    const { user: adminUser, loading: authLoading } = useAuth();
    const router = useRouter();

    const rfq = getRfqById(rfqId);
    const offers = getOffersForRfq(rfqId);
    const buyer = rfq ? findUserById(rfq.userId) : undefined;
    const loading = rfqLoading || authLoading;
    
    const [internalNote, setInternalNote] = useState(rfq?.internalOpsNotes || '');
    const [isOfferFormOpen, setIsOfferFormOpen] = useState(false);
    const [isCloseRfqOpen, setIsCloseRfqOpen] = useState(false);

    useEffect(() => {
        if (!loading && (!adminUser || adminUser.role !== 'admin')) {
            router.push(`/login?redirect=/admin/rfqs/${rfqId}`);
        }
        if (rfq) {
            setInternalNote(rfq.internalOpsNotes || '');
        }
    }, [loading, adminUser, rfqId, router, rfq]);

    const handleSaveNote = () => {
        if (rfq) {
            updateRfqInternalNotes(rfq.id, internalNote);
        }
    };
    
    if (loading || !rfq || !adminUser) {
        return <div className="container py-8"><Skeleton className="h-screen w-full" /></div>
    }

    return (
        <div className="container py-8">
            <Link href="/admin/rfqs" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
                <ArrowLeft className="h-4 w-4" />
                Back to RFQ Inbox
            </Link>

             <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">RFQ Workspace</h1>
                    <p className="text-muted-foreground">Manage RFQ ID: {rfq.id}</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                     <Card>
                        <CardHeader><CardTitle>Deal Timeline</CardTitle></CardHeader>
                        <CardContent>
                           <DealTimeline rfq={rfq} />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Conversation with Buyer</CardTitle>
                            <CardDescription>Chat with {buyer?.name || 'the buyer'} about their request.</CardDescription>
                        </CardHeader>
                        <CardContent>
                           <MessagingThread rfqId={rfq.id} />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader><CardTitle>Internal Notes</CardTitle></CardHeader>
                        <CardContent>
                            <Textarea 
                                placeholder="Add private notes for your team here..." 
                                rows={5}
                                value={internalNote}
                                onChange={(e) => setInternalNote(e.target.value)} 
                            />
                            <Button className="mt-2" onClick={handleSaveNote} disabled={internalNote === (rfq.internalOpsNotes || '')}>
                                Save Note
                            </Button>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    {buyer && (
                        <Card>
                            <CardHeader><CardTitle className="flex items-center gap-2"><UserIcon /> Buyer Details</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-1">
                                <p><strong>Name:</strong> {buyer.name}</p>
                                <p><strong>Email:</strong> {buyer.email}</p>
                                <p><strong>Company:</strong> {buyer.companyName || 'N/A'}</p>
                                <p><strong>Country:</strong> {buyer.country}</p>
                            </CardContent>
                        </Card>
                    )}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Change Status</label>
                                <Select value={rfq.status} onValueChange={(value: RFQStatus) => updateRfqStatus(rfq.id, value)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Received">Received</SelectItem>
                                        <SelectItem value="In progress">In progress</SelectItem>
                                        <SelectItem value="Offer sent">Offer sent</SelectItem>
                                        <SelectItem value="Pending execution">Pending execution</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Dialog open={isOfferFormOpen} onOpenChange={setIsOfferFormOpen}>
                                <DialogTrigger asChild>
                                    <Button className="w-full">
                                        <FileText className="mr-2 h-4 w-4" /> Create Offer
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[600px]">
                                    <DialogHeader>
                                        <DialogTitle>Create New Offer</DialogTitle>
                                    </DialogHeader>
                                    <OfferForm rfq={rfq} onFinished={() => setIsOfferFormOpen(false)} />
                                </DialogContent>
                            </Dialog>
                            <CloseRfqDialog rfqId={rfq.id} open={isCloseRfqOpen} onOpenChange={setIsCloseRfqOpen}>
                                <Button variant="destructive" className="w-full">Close RFQ</Button>
                            </CloseRfqDialog>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Sent Offers</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {offers.length > 0 ? offers.map(offer => <OfferItem key={offer.id} offer={offer} />) : <p className="text-sm text-muted-foreground">No offers sent yet.</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Request Summary</CardTitle>
                            <Badge variant="outline" className={statusColors[rfq.status]}>{rfq.status}</Badge>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
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
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
