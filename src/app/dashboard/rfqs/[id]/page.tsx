'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRfqs } from '@/hooks/use-rfqs';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/data-state';
import MessagingThread from '@/components/rfq/messaging-thread';
import OfferCard from '@/components/rfq/offer-card';
import DealTimeline from '@/components/rfq/deal-timeline';
import type { RFQStatus } from '@/lib/types';

const statusColors: Record<RFQStatus, string> = {
  Received: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  'In progress': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Offer sent': 'bg-green-100 text-green-700 border border-green-200',
  'Pending execution': 'bg-purple-100 text-purple-700 border border-purple-200',
  Won: 'bg-teal-100 text-teal-700 border border-teal-200',
  Lost: 'bg-red-100 text-red-700 border border-red-200',
};

export default function RfqDetailPage() {
  const params = useParams();
  const rfqId = params.id as string;
  const { getRfqById, getOffersForRfq, loading: rfqLoading } = useRfqs();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const rfq = getRfqById(rfqId);
  const offers = getOffersForRfq(rfqId);
  const loading = rfqLoading || authLoading;
  const [approvals, setApprovals] = useState<Array<{
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requiredApprovals: number;
    note: string | null;
    decisionNote: string | null;
    createdAt: string;
    decidedAt: string | null;
    decisions?: Array<{
      id: string;
      status: 'APPROVED' | 'REJECTED';
    }>;
    approver?: { id: string; name: string; email: string } | null;
    organization?: { id: string; name: string; slug: string } | null;
    policy?: {
      id: string;
      serviceTier: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
      approverTeamRole: 'APPROVER' | 'MANAGER' | 'OWNER';
      autoAssignEnabled: boolean;
    } | null;
  }>>([]);
  const [approvalNote, setApprovalNote] = useState('');
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [upgradeRequesting, setUpgradeRequesting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push(`/login?redirect=/dashboard/rfqs/${rfqId}`);
      } else if (rfq && rfq.userId !== user.id) {
        router.push('/dashboard/rfqs');
      }
    }
  }, [loading, user, rfq, rfqId, router]);

  useEffect(() => {
    if (!rfq || !user) return;
    let active = true;
    const loadApprovals = async () => {
      try {
        const res = await fetch(`/api/rfqs/${rfq.id}/approval`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setApprovals(Array.isArray(data.approvals) ? data.approvals : []);
      } catch (error) {
        console.error('Failed to load approvals:', error);
      }
    };
    void loadApprovals();
    return () => {
      active = false;
    };
  }, [rfq, user]);

  const requestApproval = async () => {
    if (!rfq) return;
    setApprovalLoading(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: approvalNote || undefined }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setApprovals((prev) => [data.approval, ...prev]);
      setApprovalNote('');
    } finally {
      setApprovalLoading(false);
    }
  };

  const requestPackageUpgrade = async () => {
    if (!rfq) return;
    const suggested = rfq.servicePackage === 'Core' ? 'Concierge' : 'Command';
    setUpgradeRequesting(true);
    try {
      const res = await fetch(`/api/rfqs/${rfq.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderType: 'buyer',
          message: `Please review an upgrade to ${suggested} package for this RFQ. We need tighter execution support.`,
        }),
      });
      if (!res.ok) return;
    } finally {
      setUpgradeRequesting(false);
    }
  };

  if (loading || !rfq) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="h-[680px] w-full rounded-2xl" />
      </div>
    );
  }

  const addonPrices: Record<string, number> = {
    Verification: 350,
    Logistics: 500,
    Financing: 300,
    Compliance: 450,
    DedicatedManager: 1200,
  };
  const packageBase: Record<string, number> = {
    Core: 0,
    Concierge: 900,
    Command: 2400,
  };
  const tierMultiplier: Record<string, number> = {
    Standard: 1,
    Priority: 1.35,
    Enterprise: 1.9,
  };
  const selectedAddons = rfq.packageAddons || [];
  const estimatedMonthly =
    Math.round((packageBase[rfq.servicePackage || 'Core'] || 0) * (tierMultiplier[rfq.serviceTier || 'Standard'] || 1)) +
    selectedAddons.reduce((sum, addon) => sum + (addonPrices[addon] || 0), 0);

  const hasActiveOffer = offers.some((offer) => offer.status === 'Accepted');

  return (
    <div className="page-shell">
      <Link href="/dashboard/rfqs" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to requests
      </Link>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">RFQ {rfq.id.slice(0, 12)}...</h1>
            <p className="mt-1 text-sm text-slate-600">{rfq.category} • Delivery to {rfq.deliveryCountry}</p>
          </div>
          <Badge variant="outline" className={statusColors[rfq.status]}>{rfq.status}</Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {offers.length > 0 && (
            <Card className="rounded-2xl border-border">
              <CardHeader>
                <CardTitle>Offers</CardTitle>
                <CardDescription>Commercial options received for this request.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {offers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} hasActiveOffer={hasActiveOffer} />
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-2xl border-border">
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent><DealTimeline rfq={rfq} /></CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>Message the sourcing team directly on this request.</CardDescription>
            </CardHeader>
            <CardContent><MessagingThread rfqId={rfq.id} /></CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Approval workflow</CardTitle>
              <CardDescription>Request managed approval from FleetSource operations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rfq.servicePackage === 'Core' ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <p className="font-semibold">Upgrade recommendation</p>
                  <p className="mt-1">
                    Move this RFQ to <strong>Concierge</strong> or <strong>Command</strong> for proactive supplier outreach and negotiation support.
                  </p>
                  <Button size="sm" className="mt-2" onClick={requestPackageUpgrade} disabled={upgradeRequesting}>
                    {upgradeRequesting ? 'Sending...' : 'Request upgrade review'}
                  </Button>
                </div>
              ) : null}
              {approvals.length > 0 ? (
                <div className="space-y-2">
                  {approvals.slice(0, 3).map((approval) => (
                    <div key={approval.id} className="rounded-lg border border-border bg-muted/20 p-2 text-xs">
                      <p>
                        <strong>Status:</strong> {approval.status}
                      </p>
                      <p className="mt-1 text-slate-600">
                        {approval.decisions?.filter((decision) => decision.status === 'APPROVED').length || 0}/{approval.requiredApprovals} approvals
                      </p>
                      {approval.approver ? (
                        <p className="mt-1 text-slate-600">
                          Assigned approver: {approval.approver.name}
                        </p>
                      ) : null}
                      {approval.policy ? (
                        <p className="mt-1 text-slate-500">
                          Policy: {approval.policy.serviceTier} / {approval.policy.approverTeamRole}
                        </p>
                      ) : null}
                      {approval.note ? <p className="mt-1 text-slate-600">{approval.note}</p> : null}
                      {approval.decisionNote ? <p className="mt-1 text-slate-500">Decision: {approval.decisionNote}</p> : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No approval requests yet"
                  description="Submit a note to request managed approval from operations."
                  className="p-4"
                />
              )}
              <Textarea
                rows={3}
                placeholder="Add context for approval..."
                value={approvalNote}
                onChange={(event) => setApprovalNote(event.target.value)}
              />
              <Button size="sm" onClick={requestApproval} disabled={approvalLoading}>
                Request approval
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Request details</CardTitle>
              <CardDescription>Submitted requirements and constraints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p><strong>Category:</strong> {rfq.category}</p>
              <p><strong>Key specs:</strong> {rfq.keySpecs}</p>
              {rfq.preferredBrands && <p><strong>Preferred brands:</strong> {rfq.preferredBrands}</p>}
              {(rfq.yearMin || rfq.yearMax) && <p><strong>Year:</strong> {rfq.yearMin || '?'} - {rfq.yearMax || '?'}</p>}
              {(rfq.budgetMin || rfq.budgetMax) && (
                <p><strong>Budget:</strong> {rfq.budgetMin?.toLocaleString() || '?'} - {rfq.budgetMax?.toLocaleString() || '?'}</p>
              )}
              <p><strong>Delivery:</strong> {rfq.deliveryCountry}</p>
              {rfq.pickupDeadline && <p><strong>Pickup deadline:</strong> {format(new Date(rfq.pickupDeadline), 'PPP')}</p>}
              <p><strong>Urgency:</strong> {rfq.urgency}</p>
              <p><strong>Service lane:</strong> {rfq.serviceTier || 'Standard'}</p>
              <p><strong>Service package:</strong> {rfq.servicePackage || 'Core'}</p>
              {rfq.packageAddons && rfq.packageAddons.length > 0 && (
                <p><strong>Add-ons:</strong> {rfq.packageAddons.join(', ')}</p>
              )}
              <p><strong>Estimated managed spend:</strong> ${estimatedMonthly.toLocaleString()}/month</p>
              <p><strong>Condition tolerance:</strong> {rfq.conditionTolerance}</p>
              {rfq.requiredDocuments.length > 0 && <p><strong>Required docs:</strong> {rfq.requiredDocuments.join(', ')}</p>}
              {rfq.notes && <p><strong>Notes:</strong> {rfq.notes}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
