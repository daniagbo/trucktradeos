'use client';

import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function SlaMessaging() {
    const [currentTime, setCurrentTime] = useState<string>('');
    const [timezone, setTimezone] = useState<string>('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const formatter = new Intl.DateTimeFormat('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
            });
            const parts = formatter.formatToParts(now);
            const time = parts.filter(p => p.type === 'hour' || p.type === 'minute' || p.type === 'literal').map(p => p.value).join('');
            const tz = parts.find(p => p.type === 'timeZoneName')?.value || '';

            setCurrentTime(time);
            setTimezone(tz);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 px-3 py-2 rounded-lg border border-border/50">
            <Clock className="h-4 w-4 text-primary" />
            <span>
                <strong className="text-foreground">We respond within 2 business hours</strong>
                {currentTime && <span className="ml-1">• Your time: {currentTime} {timezone}</span>}
            </span>
        </div>
    );
}
