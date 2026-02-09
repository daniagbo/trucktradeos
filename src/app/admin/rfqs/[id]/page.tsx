'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ArrowLeft, Banknote, Calendar, CheckSquare, ClipboardList, FileText, Package, Plus, Truck, User as UserIcon } from 'lucide-react';
import { useRfqs } from '@/hooks/use-rfqs';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import MessagingThread from '@/components/rfq/messaging-thread';
import OfferForm from '@/components/admin/offer-form';
import AdminAuditTimeline from '@/components/admin/audit-timeline';
import CloseRfqDialog from '@/components/rfq/close-rfq-dialog';
import DealTimeline from '@/components/rfq/deal-timeline';
import type { Offer, PackageAddon, RFQStatus, ServicePackage, ServiceTier } from '@/lib/types';

const statusColors: Record<RFQStatus, string> = {
  Received: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  'In progress': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Offer sent': 'bg-green-100 text-green-700 border border-green-200',
  'Pending execution': 'bg-purple-100 text-purple-700 border border-purple-200',
  Won: 'bg-teal-100 text-teal-700 border border-teal-200',
  Lost: 'bg-red-100 text-red-700 border border-red-200',
};

function OfferItem({ offer }: { offer: Offer }) {
  return (
    <div className="rounded-xl border border-border p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-slate-900">{offer.title}</p>
          <p className="text-xs text-slate-500">Version {offer.versionNumber}</p>
        </div>
        <Badge variant="outline">{offer.status}</Badge>
      </div>
      <div className="mt-3 space-y-1 text-slate-700">
        {offer.price && (
          <p className="flex items-center gap-2">
            <Banknote className="h-4 w-4 text-slate-500" />
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: offer.currency || 'USD' }).format(offer.price)}
          </p>
        )}
        <p className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          Valid until {format(new Date(offer.validUntil), 'PPP')}
        </p>
        {offer.terms && (
          <p className="flex items-center gap-2">
            <Truck className="h-4 w-4 text-slate-500" />
            {offer.terms}
          </p>
        )}
        {offer.availabilityText && (
          <p className="flex items-center gap-2">
            <Package className="h-4 w-4 text-slate-500" />
            {offer.availabilityText}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminRfqWorkspacePage() {
  const params = useParams();
  const rfqId = params.id as string;
  const { getRfqById, updateRfqStatus, updateRfqInternalNotes, getOffersForRfq, loading: rfqLoading } = useRfqs();
  const { user: adminUser, loading: authLoading } = useAuth();
  const router = useRouter();

  const rfq = getRfqById(rfqId);
  const offers = getOffersForRfq(rfqId);
  const loading = rfqLoading || authLoading;

  const [internalNote, setInternalNote] = useState(rfq?.internalOpsNotes || '');
  const [isOfferFormOpen, setIsOfferFormOpen] = useState(false);
  const [isCloseRfqOpen, setIsCloseRfqOpen] = useState(false);
  const [serviceTier, setServiceTier] = useState<ServiceTier>((rfq?.serviceTier || 'Standard') as ServiceTier);
  const [servicePackage, setServicePackage] = useState<ServicePackage>((rfq?.servicePackage || 'Core') as ServicePackage);
  const [packageAddons, setPackageAddons] = useState<PackageAddon[]>((rfq?.packageAddons || []) as PackageAddon[]);
  const [approvals, setApprovals] = useState<Array<{
    id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    requiredApprovals: number;
    note: string | null;
    decisionNote: string | null;
    createdAt: string;
    requester: { id: string; name: string; email: string };
    approver?: { id: string; name: string; email: string } | null;
    organization?: { id: string; name: string; slug: string } | null;
    policy?: {
      id: string;
      serviceTier: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
      approverTeamRole: 'APPROVER' | 'MANAGER' | 'OWNER';
      autoAssignEnabled: boolean;
    } | null;
    decisions?: Array<{
      id: string;
      status: 'APPROVED' | 'REJECTED';
      approver: { id: string; name: string; email: string };
    }>;
  }>>([]);
  const [decisionDrafts, setDecisionDrafts] = useState<Record<string, string>>({});
  const [benchmark, setBenchmark] = useState<{
    sampleSize: number;
    p25: number | null;
    median: number | null;
    p75: number | null;
    min: number | null;
    max: number | null;
    confidence: 'low' | 'medium' | 'high';
  } | null>(null);
  const [routingPolicies, setRoutingPolicies] = useState<Array<{
    id: string;
    serviceTier: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
    requiredApprovals: number;
    approverTeamRole: 'APPROVER' | 'MANAGER' | 'OWNER';
    autoAssignEnabled: boolean;
    active: boolean;
  }>>([]);
  const [orgMembers, setOrgMembers] = useState<Array<{
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MEMBER';
    teamRole: 'REQUESTER' | 'APPROVER' | 'MANAGER' | 'OWNER';
  }>>([]);
  const [policyDraft, setPolicyDraft] = useState<{
    requiredApprovals: number;
    approverTeamRole: 'APPROVER' | 'MANAGER' | 'OWNER';
    autoAssignEnabled: boolean;
    active: boolean;
  }>({
    requiredApprovals: 1,
    approverTeamRole: 'APPROVER',
    autoAssignEnabled: true,
    active: true,
  });
  const [policySaving, setPolicySaving] = useState(false);
  const [deliverables, setDeliverables] = useState<Array<{
    id: string;
    type: 'SOURCING_BRIEF' | 'SUPPLIER_SHORTLIST' | 'NEGOTIATION_NOTE' | 'CLOSE_MEMO' | 'BENCHMARK_REPORT' | 'SUPPLIER_COMPARISON';
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED';
    title: string;
    summary: string | null;
    dueAt: string | null;
    completedAt: string | null;
  }>>([]);
  const [deliverableForm, setDeliverableForm] = useState({
    type: 'SUPPLIER_SHORTLIST' as 'SOURCING_BRIEF' | 'SUPPLIER_SHORTLIST' | 'NEGOTIATION_NOTE' | 'CLOSE_MEMO' | 'BENCHMARK_REPORT' | 'SUPPLIER_COMPARISON',
    title: '',
  });
  const [opsTasks, setOpsTasks] = useState<Array<{
    id: string;
    title: string;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    source: string;
    createdAt: string;
  }>>([]);
  const [taskForm, setTaskForm] = useState({
    title: '',
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
  });

  useEffect(() => {
    if (!loading && (!adminUser || adminUser.role !== 'admin')) {
      router.push(`/login?redirect=/admin/rfqs/${rfqId}`);
      return;
    }
    if (rfq) {
      setInternalNote(rfq.internalOpsNotes || '');
      setServiceTier((rfq.serviceTier || 'Standard') as ServiceTier);
      setServicePackage((rfq.servicePackage || 'Core') as ServicePackage);
      setPackageAddons((rfq.packageAddons || []) as PackageAddon[]);
    }
  }, [loading, adminUser, rfqId, router, rfq]);

  useEffect(() => {
    if (!rfq) return;
    let active = true;
    const loadApprovals = async () => {
      try {
        const res = await fetch(`/api/rfqs/${rfq.id}/approval`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setApprovals(Array.isArray(data.approvals) ? data.approvals : []);
        }
      } catch (error) {
        console.error('Failed to load approvals:', error);
      }
    };
    void loadApprovals();
    return () => {
      active = false;
    };
  }, [rfq]);

  useEffect(() => {
    if (!rfq) return;
    let active = true;
    const loadExecutionArtifacts = async () => {
      try {
        const [deliverableRes, tasksRes] = await Promise.all([
          fetch(`/api/admin/rfqs/${rfq.id}/deliverables`, { cache: 'no-store' }),
          fetch(`/api/admin/ops-tasks?rfqId=${rfq.id}&limit=50`, { cache: 'no-store' }),
        ]);
        if (deliverableRes.ok) {
          const data = await deliverableRes.json();
          if (active) {
            setDeliverables(Array.isArray(data.deliverables) ? data.deliverables : []);
          }
        }
        if (tasksRes.ok) {
          const data = await tasksRes.json();
          if (active) {
            setOpsTasks(Array.isArray(data.tasks) ? data.tasks : []);
          }
        }
      } catch (error) {
        console.error('Failed to load execution artifacts:', error);
      }
    };
    void loadExecutionArtifacts();
    return () => {
      active = false;
    };
  }, [rfq]);

  useEffect(() => {
    let active = true;
    const loadPolicies = async () => {
      try {
        const res = await fetch('/api/admin/approval-policies', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (!active) return;
        setRoutingPolicies(Array.isArray(data.policies) ? data.policies : []);
        setOrgMembers(Array.isArray(data.members) ? data.members : []);
      } catch (error) {
        console.error('Failed to load approval policies:', error);
      }
    };
    void loadPolicies();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!rfq) return;
    let active = true;
    const loadBenchmark = async () => {
      try {
        const brand = encodeURIComponent(rfq.preferredBrands || '');
        const category = encodeURIComponent(rfq.category);
        const country = encodeURIComponent(rfq.deliveryCountry || '');
        const res = await fetch(`/api/insights/pricing?category=${category}&brand=${brand}&country=${country}`, {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = await res.json();
        if (active) setBenchmark(data.benchmark || null);
      } catch (error) {
        console.error('Failed to load pricing benchmark:', error);
      }
    };
    void loadBenchmark();
    return () => {
      active = false;
    };
  }, [rfq]);

  const handleSaveNote = () => {
    if (!rfq) return;
    updateRfqInternalNotes(rfq.id, internalNote);
  };

  const handleTierChange = async (value: ServiceTier) => {
    if (!rfq) return;
    setServiceTier(value);
    await fetch(`/api/rfqs/${rfq.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceTier: value }),
    });
    router.refresh();
  };

  const handlePackageChange = async (value: ServicePackage) => {
    if (!rfq) return;
    setServicePackage(value);
    await fetch(`/api/rfqs/${rfq.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ servicePackage: value }),
    });
  };

  const toggleAddon = async (addon: PackageAddon) => {
    if (!rfq) return;
    const current = packageAddons;
    const next = current.includes(addon) ? current.filter((item) => item !== addon) : [...current, addon];
    setPackageAddons(next);
    await fetch(`/api/rfqs/${rfq.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageAddons: next }),
    });
  };

  const serviceTierToDb = (value: ServiceTier): 'STANDARD' | 'PRIORITY' | 'ENTERPRISE' => {
    if (value === 'Priority') return 'PRIORITY';
    if (value === 'Enterprise') return 'ENTERPRISE';
    return 'STANDARD';
  };

  const currentTierPolicy = routingPolicies.find((policy) => policy.serviceTier === serviceTierToDb(serviceTier));

  useEffect(() => {
    if (!currentTierPolicy) return;
    setPolicyDraft({
      requiredApprovals: currentTierPolicy.requiredApprovals,
      approverTeamRole: currentTierPolicy.approverTeamRole,
      autoAssignEnabled: currentTierPolicy.autoAssignEnabled,
      active: currentTierPolicy.active,
    });
  }, [currentTierPolicy]);

  const savePolicy = async () => {
    const tier = serviceTierToDb(serviceTier);
    setPolicySaving(true);
    try {
      const res = await fetch('/api/admin/approval-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceTier: tier,
          requiredApprovals: policyDraft.requiredApprovals,
          approverTeamRole: policyDraft.approverTeamRole,
          autoAssignEnabled: policyDraft.autoAssignEnabled,
          active: policyDraft.active,
        }),
      });
      if (!res.ok) return;
      const data = await res.json();
      const saved = data.policy;
      setRoutingPolicies((prev) => {
        const next = prev.filter((item) => item.serviceTier !== saved.serviceTier);
        return [...next, saved];
      });
    } finally {
      setPolicySaving(false);
    }
  };

  const decideApproval = async (approvalId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!rfq) return;
    const decisionNote = decisionDrafts[approvalId] || '';
    const res = await fetch(`/api/rfqs/${rfq.id}/approval/${approvalId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, decisionNote: decisionNote || undefined }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setApprovals((prev) =>
      prev.map((approval) => (approval.id === approvalId ? { ...approval, ...data.approval } : approval))
    );
  };

  const updateDeliverableStatus = async (
    deliverableId: string,
    status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
  ) => {
    if (!rfq) return;
    const res = await fetch(`/api/admin/rfqs/${rfq.id}/deliverables`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliverableId, status }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setDeliverables((prev) =>
      prev.map((item) => (item.id === deliverableId ? data.deliverable : item))
    );
  };

  const createDeliverable = async () => {
    if (!rfq || !deliverableForm.title.trim()) return;
    const res = await fetch(`/api/admin/rfqs/${rfq.id}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: deliverableForm.type,
        title: deliverableForm.title.trim(),
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setDeliverables((prev) => [...prev, data.deliverable]);
    setDeliverableForm({ type: 'SUPPLIER_SHORTLIST', title: '' });
  };

  const createOpsTask = async () => {
    if (!rfq || !taskForm.title.trim()) return;
    const res = await fetch('/api/admin/ops-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: taskForm.title.trim(),
        priority: taskForm.priority,
        rfqId: rfq.id,
        source: 'manual_workspace',
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setOpsTasks((prev) => [data.task, ...prev]);
    setTaskForm({ title: '', priority: 'MEDIUM' });
  };

  const updateTaskStatus = async (taskId: string, status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED') => {
    const res = await fetch('/api/admin/ops-tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setOpsTasks((prev) => prev.map((task) => (task.id === taskId ? data.task : task)));
  };

  if (loading || !rfq || !adminUser) {
    return (
      <div className="container mx-auto px-4 py-10">
        <Skeleton className="h-[700px] w-full rounded-2xl" />
      </div>
    );
  }

  const allAddons: PackageAddon[] = ['Verification', 'Logistics', 'Financing', 'Compliance', 'DedicatedManager'];
  const missingAddons = allAddons.filter((addon) => !packageAddons.includes(addon));
  const upsellPackage = servicePackage === 'Core' ? 'Concierge' : servicePackage === 'Concierge' ? 'Command' : null;
  const upsellScript =
    upsellPackage
      ? `Given the ${serviceTier} lane and mandate complexity, I recommend upgrading to ${upsellPackage} so we can provide tighter execution ownership and faster decision cycles.`
      : 'Package is already at Command. Focus upsell on add-ons to expand delivery scope.';

  return (
    <div className="container mx-auto px-4 py-10">
      <Link href="/admin/rfqs" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to RFQ inbox
      </Link>

      <section className="mb-6 rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <ClipboardList className="h-4 w-4" />
              RFQ workspace
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">RFQ {rfq.id.slice(0, 12)}...</h1>
            <p className="mt-1 text-sm text-slate-600">{rfq.category} • Destination {rfq.deliveryCountry}</p>
          </div>
          <Badge variant="outline" className={statusColors[rfq.status]}>{rfq.status}</Badge>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader><CardTitle>Deal timeline</CardTitle></CardHeader>
            <CardContent><DealTimeline rfq={rfq} /></CardContent>
          </Card>

          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Conversation</CardTitle>
              <CardDescription>Coordinate directly with the buyer on this request.</CardDescription>
            </CardHeader>
            <CardContent><MessagingThread rfqId={rfq.id} /></CardContent>
          </Card>

          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader><CardTitle>Internal notes</CardTitle></CardHeader>
            <CardContent>
              <Textarea
                placeholder="Private notes for internal ops handoff..."
                rows={5}
                value={internalNote}
                onChange={(event) => setInternalNote(event.target.value)}
              />
              <Button className="mt-3" onClick={handleSaveNote} disabled={internalNote === (rfq.internalOpsNotes || '')}>
                Save note
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
              <CardDescription>Status transitions and commercial response.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Change status</label>
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

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Service lane</label>
                <Select value={serviceTier} onValueChange={(value: ServiceTier) => handleTierChange(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard (72h)</SelectItem>
                    <SelectItem value="Priority">Priority (24h)</SelectItem>
                    <SelectItem value="Enterprise">Enterprise (8h)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Managed package</label>
                <Select value={servicePackage} onValueChange={(value: ServicePackage) => handlePackageChange(value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Core">Core</SelectItem>
                    <SelectItem value="Concierge">Concierge</SelectItem>
                    <SelectItem value="Command">Command</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Add-ons</label>
                <div className="flex flex-wrap gap-2">
                  {(['Verification', 'Logistics', 'Financing', 'Compliance', 'DedicatedManager'] as PackageAddon[]).map((addon) => {
                    const active = packageAddons.includes(addon);
                    return (
                      <button
                        key={addon}
                        type="button"
                        onClick={() => toggleAddon(addon)}
                        className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${
                          active
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-background text-slate-600'
                        }`}
                      >
                        {addon}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                <p className="font-semibold">Recommended upsell script</p>
                <p className="mt-1">{upsellScript}</p>
                {missingAddons.length > 0 ? (
                  <p className="mt-2">
                    Suggested add-ons: <strong>{missingAddons.slice(0, 3).join(', ')}</strong>
                  </p>
                ) : (
                  <p className="mt-2">All major add-ons already attached.</p>
                )}
              </div>

              <Dialog open={isOfferFormOpen} onOpenChange={setIsOfferFormOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Create offer
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[650px]">
                  <DialogHeader><DialogTitle>Create commercial offer</DialogTitle></DialogHeader>
                  <OfferForm rfq={rfq} onFinished={() => setIsOfferFormOpen(false)} />
                </DialogContent>
              </Dialog>

              <CloseRfqDialog rfqId={rfq.id} open={isCloseRfqOpen} onOpenChange={setIsCloseRfqOpen}>
                <Button variant="destructive" className="w-full">Close RFQ</Button>
              </CloseRfqDialog>
            </CardContent>
          </Card>

          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Approval requests</CardTitle>
              <CardDescription>Buyer requests requiring operational approval.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No approval requests yet.</p>
              ) : (
                approvals.map((approval) => (
                  <div key={approval.id} className="rounded-xl border border-border p-3 text-sm">
                    <p className="font-semibold text-slate-900">{approval.requester.name} ({approval.requester.email})</p>
                    <p className="mt-1 text-xs text-slate-500">Status: {approval.status}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Progress: {approval.decisions?.filter((decision) => decision.status === 'APPROVED').length || 0}/{approval.requiredApprovals}
                    </p>
                    {approval.approver ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Assigned: {approval.approver.name}
                      </p>
                    ) : null}
                    {approval.policy ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Policy: {approval.policy.serviceTier} / {approval.policy.approverTeamRole}
                      </p>
                    ) : null}
                    {approval.note ? <p className="mt-2 text-slate-700">{approval.note}</p> : null}
                    {approval.status === 'PENDING' ? (
                      <div className="mt-2 space-y-2">
                        <Textarea
                          rows={2}
                          placeholder="Decision note (optional)"
                          value={decisionDrafts[approval.id] || ''}
                          onChange={(event) =>
                            setDecisionDrafts((prev) => ({ ...prev, [approval.id]: event.target.value }))
                          }
                        />
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => decideApproval(approval.id, 'APPROVED')}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => decideApproval(approval.id, 'REJECTED')}>Reject</Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-slate-500">{approval.decisionNote || 'No decision note provided.'}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Approval routing</CardTitle>
              <CardDescription>
                Configure per-tier auto-approval assignment for your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-xs text-slate-500">
                Tier in context: <strong>{serviceTierToDb(serviceTier)}</strong>
              </p>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Required approvals
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={policyDraft.requiredApprovals}
                  onChange={(event) =>
                    setPolicyDraft((prev) => ({
                      ...prev,
                      requiredApprovals: Math.max(1, Math.min(5, Number(event.target.value) || 1)),
                    }))
                  }
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                />
              </label>
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-500">
                Approver role
                <select
                  value={policyDraft.approverTeamRole}
                  onChange={(event) =>
                    setPolicyDraft((prev) => ({
                      ...prev,
                      approverTeamRole: event.target.value as 'APPROVER' | 'MANAGER' | 'OWNER',
                    }))
                  }
                  className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="APPROVER">Approver</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                <span>Auto-assign approvers</span>
                <input
                  type="checkbox"
                  checked={policyDraft.autoAssignEnabled}
                  onChange={(event) =>
                    setPolicyDraft((prev) => ({
                      ...prev,
                      autoAssignEnabled: event.target.checked,
                    }))
                  }
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs">
                <span>Policy active</span>
                <input
                  type="checkbox"
                  checked={policyDraft.active}
                  onChange={(event) =>
                    setPolicyDraft((prev) => ({
                      ...prev,
                      active: event.target.checked,
                    }))
                  }
                />
              </label>
              <Button size="sm" onClick={savePolicy} disabled={policySaving}>
                Save routing policy
              </Button>
              <div className="rounded-lg border border-border p-2">
                <p className="mb-1 text-xs font-medium text-slate-600">Available approvers in org</p>
                <div className="space-y-1">
                  {orgMembers
                    .filter((member) => ['APPROVER', 'MANAGER', 'OWNER'].includes(member.teamRole))
                    .slice(0, 6)
                    .map((member) => (
                      <p key={member.id} className="text-xs text-slate-600">
                        {member.name} • {member.teamRole}
                      </p>
                    ))}
                  {orgMembers.filter((member) => ['APPROVER', 'MANAGER', 'OWNER'].includes(member.teamRole)).length === 0 ? (
                    <p className="text-xs text-slate-500">No approvers configured yet.</p>
                  ) : null}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Execution deliverables</CardTitle>
              <CardDescription>Track internal work products tied to this RFQ.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-[180px_1fr_auto]">
                <select
                  value={deliverableForm.type}
                  onChange={(event) =>
                    setDeliverableForm((prev) => ({
                      ...prev,
                      type: event.target.value as typeof prev.type,
                    }))
                  }
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="SOURCING_BRIEF">Sourcing brief</option>
                  <option value="SUPPLIER_SHORTLIST">Supplier shortlist</option>
                  <option value="NEGOTIATION_NOTE">Negotiation note</option>
                  <option value="BENCHMARK_REPORT">Benchmark report</option>
                  <option value="SUPPLIER_COMPARISON">Supplier comparison</option>
                  <option value="CLOSE_MEMO">Close memo</option>
                </select>
                <input
                  value={deliverableForm.title}
                  onChange={(event) =>
                    setDeliverableForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="New deliverable title"
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
                <Button size="sm" onClick={createDeliverable}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              {deliverables.length === 0 ? (
                <p className="text-sm text-muted-foreground">No deliverables yet.</p>
              ) : (
                deliverables.map((item) => (
                  <div key={item.id} className="rounded-xl border border-border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                      <select
                        value={item.status}
                        onChange={(event) =>
                          updateDeliverableStatus(
                            item.id,
                            event.target.value as 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'
                          )
                        }
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="DONE">DONE</option>
                        <option value="BLOCKED">BLOCKED</option>
                      </select>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{item.type}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4" />
                Ops task inbox
              </CardTitle>
              <CardDescription>Actionable tasks generated by policy triggers and manual triage.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-[1fr_140px_auto]">
                <input
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="Create task for this RFQ"
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
                <select
                  value={taskForm.priority}
                  onChange={(event) =>
                    setTaskForm((prev) => ({
                      ...prev,
                      priority: event.target.value as typeof prev.priority,
                    }))
                  }
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
                <Button size="sm" onClick={createOpsTask}>
                  Add task
                </Button>
              </div>
              {opsTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tasks linked to this RFQ.</p>
              ) : (
                opsTasks.map((task) => (
                  <div key={task.id} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">
                          {task.priority} • {task.source}
                        </p>
                      </div>
                      <select
                        value={task.status}
                        onChange={(event) =>
                          updateTaskStatus(
                            task.id,
                            event.target.value as 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED'
                          )
                        }
                        className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                      >
                        <option value="OPEN">OPEN</option>
                        <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                        <option value="RESOLVED">RESOLVED</option>
                      </select>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader><CardTitle>Buyer reference</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              <p className="flex items-center gap-2"><UserIcon className="h-4 w-4 text-slate-500" /> User ID: {rfq.userId}</p>
              <p><strong>Urgency:</strong> {rfq.urgency}</p>
              <p><strong>Business goal:</strong> {rfq.businessGoal || '-'}</p>
              <p><strong>Risk tolerance:</strong> {rfq.riskTolerance || '-'}</p>
              <p><strong>Budget confidence:</strong> {rfq.budgetConfidence || '-'}</p>
              <p><strong>Mandate completeness:</strong> {rfq.mandateCompleteness ?? '-'}%</p>
              <p><strong>Service package:</strong> {servicePackage}</p>
              <p><strong>Package add-ons:</strong> {packageAddons.length > 0 ? packageAddons.join(', ') : 'None'}</p>
              {(rfq.yearMin || rfq.yearMax) && <p><strong>Year range:</strong> {rfq.yearMin || '?'} - {rfq.yearMax || '?'}</p>}
              {(rfq.budgetMin || rfq.budgetMax) && <p><strong>Budget:</strong> {rfq.budgetMin?.toLocaleString() || '?'} - {rfq.budgetMax?.toLocaleString() || '?'}</p>}
              {rfq.pickupDeadline && <p><strong>Pickup deadline:</strong> {format(new Date(rfq.pickupDeadline), 'PPP')}</p>}
            </CardContent>
          </Card>

          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader>
              <CardTitle>Market pricing intelligence</CardTitle>
              <CardDescription>Benchmark for similar offers/listings in this scope.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-700">
              {benchmark && benchmark.sampleSize >= 3 ? (
                <>
                  <p><strong>Sample size:</strong> {benchmark.sampleSize} records</p>
                  <p><strong>Median:</strong> {benchmark.median?.toLocaleString() ?? '-'} </p>
                  <p><strong>Interquartile range:</strong> {benchmark.p25?.toLocaleString() ?? '-'} - {benchmark.p75?.toLocaleString() ?? '-'}</p>
                  <p><strong>Observed min/max:</strong> {benchmark.min?.toLocaleString() ?? '-'} - {benchmark.max?.toLocaleString() ?? '-'}</p>
                  <p><strong>Confidence:</strong> {benchmark.confidence}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not enough data yet to build a reliable benchmark.</p>
              )}
            </CardContent>
          </Card>

          <Card className="fx-lift rounded-2xl border-border">
            <CardHeader><CardTitle>Offers sent</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {offers.length > 0 ? offers.map((offer) => <OfferItem key={offer.id} offer={offer} />) : (
                <p className="text-sm text-muted-foreground">No offers sent yet.</p>
              )}
            </CardContent>
          </Card>

          <AdminAuditTimeline entityId={rfq.id} scope="rfq" title="Ops audit trail" />
        </div>
      </div>
    </div>
  );
}
