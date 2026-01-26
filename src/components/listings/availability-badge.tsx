import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, Lock, XCircle } from 'lucide-react';
import type { AvailabilityStatus } from '@/lib/types';

interface AvailabilityBadgeProps {
    status: AvailabilityStatus;
    className?: string;
}

export default function AvailabilityBadge({ status, className }: AvailabilityBadgeProps) {
    const config = {
        available: {
            label: 'Available Now',
            icon: CheckCircle,
            className: 'bg-emerald-500/95 text-white border-none backdrop-blur-sm',
        },
        expected: {
            label: 'Expected',
            icon: Clock,
            className: 'bg-blue-500/95 text-white border-none backdrop-blur-sm',
        },
        reserved: {
            label: 'Reserved',
            icon: Lock,
            className: 'bg-amber-500/95 text-white border-none backdrop-blur-sm',
        },
        sold: {
            label: 'Sold',
            icon: XCircle,
            className: 'bg-gray-500/95 text-white border-none backdrop-blur-sm',
        },
    };

    const statusConfig = config[status] || config.available;
    const { label, icon: Icon, className: statusClassName } = statusConfig;

    return (
        <Badge
            className={`font-bold shadow-sm px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider flex items-center gap-1 ${statusClassName} ${className || ''}`}
        >
            <Icon className="h-3 w-3" />
            {label}
        </Badge>
    );
}
