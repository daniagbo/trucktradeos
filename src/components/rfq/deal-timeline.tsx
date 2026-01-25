'use client';
import { RFQ, RFQEvent } from '@/lib/types';
import { format } from 'date-fns';
import { FileText, MessageSquare, CheckCircle, XCircle, DollarSign, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DealTimelineProps {
    rfq: RFQ;
}

const eventIcons = {
    status_change: Zap,
    message: MessageSquare,
    offer_sent: DollarSign,
    offer_accepted: CheckCircle,
    offer_declined: XCircle,
    rfq_closed: FileText,
};

const getEventDescription = (event: RFQEvent): string => {
    switch(event.type) {
        case 'status_change': return `Status changed to ${event.payload.status}`;
        case 'message': return `${event.payload.author} sent a message: "${event.payload.message?.substring(0, 50)}..."`;
        case 'offer_sent': return `Offer sent: ${event.payload.title}`;
        case 'offer_accepted': return `Offer accepted: ${event.payload.title}`;
        case 'offer_declined': return `Offer declined: ${event.payload.title}. Reason: ${event.payload.reason || 'Not provided'}`;
        case 'rfq_closed': return `RFQ closed as ${event.payload.status}. Reason: ${event.payload.reason || 'N/A'}`;
        default: return 'An event occurred';
    }
}

export default function DealTimeline({ rfq }: DealTimelineProps) {
    const sortedEvents = [...rfq.events].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return (
        <div className="space-y-8">
            {sortedEvents.map((event, index) => {
                const Icon = eventIcons[event.type] || FileText;
                return (
                    <div key={event.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <Icon className="h-4 w-4" />
                            </span>
                            {index < sortedEvents.length - 1 && <div className="h-full w-px bg-border my-2"></div>}
                        </div>
                        <div>
                            <p className="font-medium text-sm">{getEventDescription(event)}</p>
                            <p className="text-xs text-muted-foreground">{format(new Date(event.timestamp), "MMM d, yyyy 'at' h:mm a")}</p>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
