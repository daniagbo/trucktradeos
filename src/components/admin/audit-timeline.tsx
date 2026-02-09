'use client';

import { useEffect, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type AuditLogItem = {
  id: string;
  action: string;
  createdAt: string;
  metadata: Record<string, unknown> | null;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
};

const LABELS: Record<string, string> = {
  'listing.create': 'Listing created',
  'listing.update': 'Listing updated',
  'listing.delete': 'Listing deleted',
  'rfq.update': 'RFQ updated',
  'rfq.close': 'RFQ closed',
  'rfq.message': 'Admin message',
  'offer.create': 'Offer created',
  'offer.update': 'Offer updated',
};

interface AdminAuditTimelineProps {
  entityId: string;
  scope: 'listing' | 'rfq';
  title?: string;
}

export default function AdminAuditTimeline({ entityId, scope, title = 'Audit timeline' }: AdminAuditTimelineProps) {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/audit-logs?entityId=${encodeURIComponent(entityId)}&scope=${scope}&limit=12`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json() as { logs?: AuditLogItem[] };
        if (active) {
          setLogs(payload.logs || []);
        }
      } catch (error) {
        console.error('Failed to fetch audit timeline:', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    return () => {
      active = false;
    };
  }, [entityId, scope]);

  return (
    <Card className="rounded-2xl border-border">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading history...
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events yet.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="rounded-lg border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">{LABELS[log.action] || log.action}</p>
                <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                  {log.user.role}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                {log.user.name} ({log.user.email}) • {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
