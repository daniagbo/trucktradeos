'use client';
import { useState } from 'react';
import { useRfqs } from '@/hooks/use-rfqs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';

interface CloseRfqDialogProps {
    rfqId: string;
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const reasonOptions = ['Price', 'Timing', 'Specs mismatch', 'Paperwork', 'Buyer disappeared', 'Other'];

export default function CloseRfqDialog({ rfqId, children, open, onOpenChange }: CloseRfqDialogProps) {
    const { closeRfq } = useRfqs();
    const [status, setStatus] = useState<'Won' | 'Lost'>('Lost');
    const [reason, setReason] = useState('');
    const [otherReason, setOtherReason] = useState('');

    const handleSubmit = () => {
        let finalReason = reason;
        if (reason === 'Other') {
            finalReason = otherReason;
        }
        closeRfq(rfqId, status, finalReason);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="rounded-2xl border-gray-100 dark:border-gray-800">
                <DialogHeader>
                    <DialogTitle className="text-[#111318] dark:text-white">Close RFQ</DialogTitle>
                    <DialogDescription>Set the final status for this sourcing request.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Outcome</Label>
                        <RadioGroup defaultValue="Lost" value={status} onValueChange={(value: 'Won' | 'Lost') => setStatus(value)}>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Won" id="won" /><Label htmlFor="won">Won</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="Lost" id="lost" /><Label htmlFor="lost">Lost</Label></div>
                        </RadioGroup>
                    </div>
                    {status === 'Lost' && (
                        <div className="space-y-2">
                            <Label htmlFor="reason">Reason for Loss</Label>
                            <Select onValueChange={setReason} value={reason}>
                                <SelectTrigger><SelectValue placeholder="Select a reason" /></SelectTrigger>
                                <SelectContent>
                                    {reasonOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            {reason === 'Other' && (
                                <Textarea placeholder="Please specify the reason..." value={otherReason} onChange={e => setOtherReason(e.target.value)} />
                            )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button className="rounded-xl" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button className="rounded-xl" onClick={handleSubmit}>Confirm and Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
