'use client';
import { useState } from 'react';
import { Offer } from '@/lib/types';
import { useRfqs } from '@/hooks/use-rfqs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { format } from 'date-fns';
import { Banknote, Calendar, Check, CheckCircle, Package, ThumbsDown, Truck, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { Textarea } from '../ui/textarea';

interface OfferCardProps {
    offer: Offer;
    hasActiveOffer: boolean;
}

const offerStatusColors = {
    Sent: 'border-blue-500/50 bg-blue-50 text-blue-700',
    Accepted: 'border-green-500/50 bg-green-50 text-green-700',
    Declined: 'border-red-500/50 bg-red-50 text-red-700',
    Expired: 'border-gray-500/50 bg-gray-50 text-gray-700',
    Draft: '',
};

export default function OfferCard({ offer, hasActiveOffer }: OfferCardProps) {
    const { updateOfferStatus } = useRfqs();
    const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false);
    const [declineReason, setDeclineReason] = useState('');
    const isOfferActionable = offer.status === 'Sent' && !hasActiveOffer && new Date(offer.validUntil) > new Date();

    const handleDecline = () => {
        updateOfferStatus(offer.id, 'Declined', declineReason);
        setIsDeclineDialogOpen(false);
    };

    return (
        <Card className={offer.status === 'Accepted' ? 'border-primary' : ''}>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>{offer.title} <span className="text-sm font-normal text-muted-foreground">(v{offer.versionNumber})</span></CardTitle>
                    <Badge variant="outline" className={offerStatusColors[offer.status]}>{offer.status}</Badge>
                </div>
                <CardDescription>Sent on {format(new Date(offer.sentAt!), "PPP")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    {offer.price && <div className="flex items-center gap-2"><Banknote className="w-4 h-4 text-muted-foreground" /> <div><strong>Price:</strong><br />{new Intl.NumberFormat('en-US', { style: 'currency', currency: offer.currency || 'USD' }).format(offer.price)}</div></div>}
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /> <div><strong>Valid Until:</strong><br />{format(new Date(offer.validUntil), "PPP")}</div></div>
                    <div className="flex items-center gap-2"><Truck className="w-4 h-4 text-muted-foreground" /> <div><strong>Terms:</strong><br />{offer.terms}</div></div>
                    <div className="flex items-center gap-2"><Package className="w-4 h-4 text-muted-foreground" /> <div><strong>Availability:</strong><br />{offer.availabilityText}</div></div>
                </div>
                {offer.notes && <p className="text-sm text-muted-foreground pt-4 border-t">{offer.notes}</p>}

                {Object.keys(offer.includedFlags).length > 0 && (
                    <div className="pt-4 border-t">
                        <h4 className="font-semibold text-sm mb-2">Included in this offer:</h4>
                        <ul className="space-y-1 text-sm">
                            {Object.entries(offer.includedFlags).map(([key, value]) => value && (
                                <li key={key} className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> {key}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
            {isOfferActionable && (
                <CardFooter className="flex gap-2">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button className="w-full"><Check className="mr-2 h-4 w-4" /> Accept Offer</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Accept this offer?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    By accepting, you agree to the terms and price outlined. Our team will contact you shortly to finalize the deal.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => updateOfferStatus(offer.id, 'Accepted')}>Confirm Acceptance</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <AlertDialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full"><ThumbsDown className="mr-2 h-4 w-4" /> Decline</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Decline Offer</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Please provide a reason for declining this offer to help us better serve you in the future.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <Textarea
                                placeholder="Optional: e.g., Price is too high, found a different option..."
                                value={declineReason}
                                onChange={(e) => setDeclineReason(e.target.value)}
                            />
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDecline} className="bg-destructive hover:bg-destructive/90">
                                    Confirm Decline
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardFooter>
            )}
        </Card>
    );
}
