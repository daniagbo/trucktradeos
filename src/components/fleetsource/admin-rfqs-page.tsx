'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, BarChart3, ClipboardList, Filter, Pin, Save, Search, Timer, TriangleAlert, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRfqs } from '@/hooks/use-rfqs';
import type { RFQ, RFQStatus } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState, LoadingState } from '@/components/ui/data-state';

const statusStyles: Record<RFQStatus, string> = {
  Received: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  'In progress': 'bg-blue-100 text-blue-700 border border-blue-200',
  'Offer sent': 'bg-green-100 text-green-700 border border-green-200',
  'Pending execution': 'bg-purple-100 text-purple-700 border border-purple-200',
  Won: 'bg-teal-100 text-teal-700 border border-teal-200',
  Lost: 'bg-gray-100 text-gray-600 border border-gray-200',
};

const tabs: Array<'All' | RFQStatus> = ['All', 'Received', 'In progress', 'Offer sent', 'Pending execution', 'Won', 'Lost'];

type SortBy = 'Date' | 'Country' | 'Status' | 'Urgency';
type TimeWindow = 'All' | 'Today' | '7d' | '30d';
type OfferState = 'All' | 'With offers' | 'No offers';
type Urgency = 'All' | 'Urgent' | 'Normal';

type RfqFilterState = {
  activeStatus: 'All' | RFQStatus;
  searchQuery: string;
  sortBy: SortBy;
  urgencyFilter: Urgency;
  offerStateFilter: OfferState;
  timeWindow: TimeWindow;
};

type RfqPreset = {
  id: string;
  name: string;
  state: RfqFilterState;
};

type SupplierScorecard = {
  supplierId: string;
  supplierName: string;
  country: string;
  offersSent: number;
  offersAccepted: number;
  offersDeclined: number;
  acceptanceRate: number;
  winRate: number;
  avgResponseHours: number | null;
};

type QueueItem = {
  id: string;
  status: string;
  serviceTier: string;
  slaTargetHours: number;
  ageHours: number;
  overdue: boolean;
  hasOffer: boolean;
  score: number;
  category: string | null;
  urgency: string | null;
  createdAt: string;
};

type EscalationItem = {
  rfqId: string;
  serviceTier: string;
  status: string;
  ageHours: number;
  slaTargetHours: number;
  escalationLevel: 'warning' | 'critical';
  hasOffer: boolean;
};

type EscalationSummaryItem = {
  serviceTier: string;
  warningThresholdRatio: number;
  criticalThresholdRatio: number;
  warningCount: number;
  criticalCount: number;
};

type ExecutiveInsights = {
  summary: {
    totalRfqs: number;
    openRfqs: number;
    winRate: number;
    offerCoverageRate: number;
    avgFirstOfferHours: number | null;
    avgCycleHours: number | null;
    avgMandateCompleteness: number | null;
  } | null;
  trend: Array<{
    weekStart: string;
    created: number;
    closed: number;
  }>;
  backlog: Array<{
    serviceTier: string;
    open: number;
    overdue: number;
  }>;
  blockers: Array<{
    source: string;
    priority: string;
    count: number;
  }>;
  deliverables: {
    total: number;
    done: number;
    completionRate: number;
  } | null;
};

type CommercialInsights = {
  summary: {
    totalRfqs: number;
    offerCoverageRate: number;
    winRate: number;
    lostRate: number;
  } | null;
  tierPerformance: Array<{
    tier: string;
    rfqCount: number;
    offerCoverage: number;
    winRate: number;
    avgOfferPrice: number | null;
  }>;
  lossReasons: Array<{ reason: string; count: number }>;
  responseDistribution: Array<{ bucket: string; count: number }>;
};

type RevenueOpportunities = {
  summary: {
    totalRfqs: number;
    weightedPipelineValue: number;
    coreShare: number;
    upgrades: number;
    downgradeCount: number;
    upgradeRate: number;
  } | null;
  conversionByTier: Array<{
    tier: string;
    total: number;
    upgrades: number;
    upgradeRate: number;
  }>;
  packageMix: Array<{ package: 'Core' | 'Concierge' | 'Command'; count: number }>;
  addonMix: Array<{ addon: string; count: number }>;
  upsellCandidates: Array<{ rfqId: string; reason: string }>;
};

type SlaState = {
  label: string;
  className: string;
};

function getSlaState(rfq: RFQ, offerCount: number): SlaState {
  if (rfq.status === 'Won' || rfq.status === 'Lost') {
    return { label: 'Closed', className: 'bg-slate-100 text-slate-700' };
  }

  const ageHours = (Date.now() - new Date(rfq.createdAt).getTime()) / (1000 * 60 * 60);

  if (offerCount === 0 && ageHours >= 48) {
    return { label: 'Overdue >48h', className: 'bg-rose-100 text-rose-700' };
  }
  if (offerCount === 0 && ageHours >= 24) {
    return { label: 'Due <48h', className: 'bg-amber-100 text-amber-700' };
  }
  if (offerCount > 0 && ageHours >= 72) {
    return { label: 'Follow-up', className: 'bg-sky-100 text-sky-700' };
  }

  return { label: 'On track', className: 'bg-emerald-100 text-emerald-700' };
}

function makeState(
  activeStatus: 'All' | RFQStatus,
  searchQuery: string,
  sortBy: SortBy,
  urgencyFilter: Urgency,
  offerStateFilter: OfferState,
  timeWindow: TimeWindow
): RfqFilterState {
  return { activeStatus, searchQuery, sortBy, urgencyFilter, offerStateFilter, timeWindow };
}

export default function FleetSourceAdminRfqsPage({ variant = 'inbox' }: { variant?: 'inbox' | 'insights' }) {
  const { rfqs, offers, loading } = useRfqs();
  const router = useRouter();
  const [activeStatus, setActiveStatus] = useState<'All' | RFQStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('Date');
  const [urgencyFilter, setUrgencyFilter] = useState<Urgency>('All');
  const [offerStateFilter, setOfferStateFilter] = useState<OfferState>('All');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('All');
  const [presets, setPresets] = useState<RfqPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('none');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [watchedOnly, setWatchedOnly] = useState(false);
  const [watchlistSet, setWatchlistSet] = useState<Set<string>>(new Set());
  const [scorecards, setScorecards] = useState<SupplierScorecard[]>([]);
  const [priorityQueue, setPriorityQueue] = useState<QueueItem[]>([]);
  const [escalations, setEscalations] = useState<EscalationItem[]>([]);
  const [escalationSummary, setEscalationSummary] = useState<EscalationSummaryItem[]>([]);
  const [executiveInsights, setExecutiveInsights] = useState<ExecutiveInsights | null>(null);
  const [commercialInsights, setCommercialInsights] = useState<CommercialInsights | null>(null);
  const [revenueOpportunities, setRevenueOpportunities] = useState<RevenueOpportunities | null>(null);

  const loadPresets = async () => {
    try {
      const res = await fetch('/api/admin/views?scope=RFQS', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const rows = Array.isArray(data.views) ? (data.views as Array<{ id: string; name: string; state: RfqFilterState }>) : [];
      setPresets(rows.map((row) => ({ id: row.id, name: row.name, state: row.state })));
    } catch (error) {
      console.error('Failed to load RFQ presets:', error);
    }
  };

  useEffect(() => {
    void loadPresets();
    void (async () => {
      try {
        const res = await fetch('/api/watchlist?entityType=RFQ', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const ids = Array.isArray(data.items) ? data.items.map((item: { entityId: string }) => item.entityId) : [];
        setWatchlistSet(new Set(ids));
      } catch (error) {
        console.error('Failed to load RFQ watchlist:', error);
      }
    })();
    void (async () => {
      try {
        const res = await fetch('/api/admin/scorecards/suppliers', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setScorecards(Array.isArray(data.scorecards) ? data.scorecards : []);
      } catch (error) {
        console.error('Failed to load supplier scorecards:', error);
      }
    })();
    void (async () => {
      try {
        const res = await fetch('/api/admin/queue/priority?limit=8', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setPriorityQueue(Array.isArray(data.queue) ? data.queue : []);
      } catch (error) {
        console.error('Failed to load priority queue:', error);
      }
    })();
    void (async () => {
      try {
        const res = await fetch('/api/admin/queue/escalations', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setEscalations(Array.isArray(data.items) ? data.items : []);
        setEscalationSummary(Array.isArray(data.summary) ? data.summary : []);
      } catch (error) {
        console.error('Failed to load escalations:', error);
      }
    })();
    void (async () => {
      try {
        const res = await fetch('/api/admin/insights/executive', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setExecutiveInsights(data as ExecutiveInsights);
      } catch (error) {
        console.error('Failed to load executive insights:', error);
      }
    })();
    void (async () => {
      try {
        const res = await fetch('/api/admin/insights/commercial', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setCommercialInsights(data as CommercialInsights);
      } catch (error) {
        console.error('Failed to load commercial insights:', error);
      }
    })();
    void (async () => {
      try {
        const res = await fetch('/api/admin/insights/revenue-opportunities', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        setRevenueOpportunities(data as RevenueOpportunities);
      } catch (error) {
        console.error('Failed to load revenue opportunities:', error);
      }
    })();
  }, []);

  const currentState = useMemo(
    () => makeState(activeStatus, searchQuery, sortBy, urgencyFilter, offerStateFilter, timeWindow),
    [activeStatus, offerStateFilter, searchQuery, sortBy, timeWindow, urgencyFilter]
  );

  const applyState = (state: RfqFilterState) => {
    setActiveStatus(state.activeStatus);
    setSearchQuery(state.searchQuery);
    setSortBy(state.sortBy);
    setUrgencyFilter(state.urgencyFilter);
    setOfferStateFilter(state.offerStateFilter);
    setTimeWindow(state.timeWindow);
  };

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const now = Date.now();
    const rows = rfqs.filter((rfq) => {
      if (activeStatus !== 'All' && rfq.status !== activeStatus) return false;
      if (urgencyFilter !== 'All' && rfq.urgency !== urgencyFilter) return false;

      if (offerStateFilter !== 'All') {
        const hasOffer = offers.some((offer) => offer.rfqId === rfq.id);
        if (offerStateFilter === 'With offers' && !hasOffer) return false;
        if (offerStateFilter === 'No offers' && hasOffer) return false;
      }
      if (watchedOnly && !watchlistSet.has(rfq.id)) return false;

      if (timeWindow !== 'All') {
        const ageMs = now - new Date(rfq.createdAt).getTime();
        if (timeWindow === 'Today' && ageMs > 24 * 60 * 60 * 1000) return false;
        if (timeWindow === '7d' && ageMs > 7 * 24 * 60 * 60 * 1000) return false;
        if (timeWindow === '30d' && ageMs > 30 * 24 * 60 * 60 * 1000) return false;
      }

      if (!query) return true;
      return (
        rfq.id.toLowerCase().includes(query) ||
        rfq.category.toLowerCase().includes(query) ||
        rfq.deliveryCountry.toLowerCase().includes(query)
      );
    });

    return [...rows].sort((a, b) => {
      if (sortBy === 'Date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'Country') return a.deliveryCountry.localeCompare(b.deliveryCountry);
      if (sortBy === 'Status') return a.status.localeCompare(b.status);
      return a.urgency.localeCompare(b.urgency);
    });
  }, [activeStatus, offerStateFilter, offers, rfqs, searchQuery, sortBy, timeWindow, urgencyFilter, watchedOnly, watchlistSet]);

  const allFilteredSelected = filtered.length > 0 && filtered.every((item) => selectedIds.includes(item.id));

  const counts = useMemo(() => {
    const activePipeline = rfqs.filter((rfq) => !['Won', 'Lost'].includes(rfq.status)).length;
    const urgent = rfqs.filter((rfq) => rfq.urgency === 'Urgent').length;
    const waitingForOffer = rfqs.filter((rfq) => !offers.some((offer) => offer.rfqId === rfq.id)).length;
    return {
      total: rfqs.length,
      active: activePipeline,
      urgent,
      waitingForOffer,
    };
  }, [offers, rfqs]);

  const funnel = useMemo(() => {
    const total = rfqs.length || 1;
    const received = rfqs.filter((rfq) => rfq.status === 'Received').length;
    const inProgress = rfqs.filter((rfq) => rfq.status === 'In progress').length;
    const offerSent = rfqs.filter((rfq) => rfq.status === 'Offer sent').length;
    const pendingExecution = rfqs.filter((rfq) => rfq.status === 'Pending execution').length;
    const won = rfqs.filter((rfq) => rfq.status === 'Won').length;
    const lost = rfqs.filter((rfq) => rfq.status === 'Lost').length;

    const withAnyOffer = rfqs.filter((rfq) => offers.some((offer) => offer.rfqId === rfq.id)).length;
    const offerCoverageRate = (withAnyOffer / total) * 100;
    const winRate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;

    const firstOfferHours: number[] = rfqs.flatMap((rfq) => {
      const rfqOffers = offers
        .filter((offer) => offer.rfqId === rfq.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      if (rfqOffers.length === 0) return [];
      const firstOffer = rfqOffers[0];
      const hours = (new Date(firstOffer.createdAt).getTime() - new Date(rfq.createdAt).getTime()) / (1000 * 60 * 60);
      return Number.isFinite(hours) && hours >= 0 ? [hours] : [];
    });
    const avgFirstOfferHours =
      firstOfferHours.length > 0
        ? firstOfferHours.reduce((sum, value) => sum + value, 0) / firstOfferHours.length
        : 0;

    return {
      total,
      stages: [
        { label: 'Received', value: received },
        { label: 'In progress', value: inProgress },
        { label: 'Offer sent', value: offerSent },
        { label: 'Pending execution', value: pendingExecution },
        { label: 'Won', value: won },
        { label: 'Lost', value: lost },
      ],
      offerCoverageRate,
      winRate,
      avgFirstOfferHours,
    };
  }, [offers, rfqs]);

  const clearFilters = () => {
    applyState(makeState('All', '', 'Date', 'All', 'All', 'All'));
    setWatchedOnly(false);
    setSelectedPresetId('none');
  };

  const toggleWatch = async (rfqId: string) => {
    const watched = watchlistSet.has(rfqId);
    const res = await fetch('/api/watchlist', {
      method: watched ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: 'RFQ', entityId: rfqId }),
    });
    if (!res.ok) return;
    setWatchlistSet((prev) => {
      const next = new Set(prev);
      if (watched) next.delete(rfqId);
      else next.add(rfqId);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filtered.some((item) => item.id === id)));
      return;
    }
    const newIds = filtered.map((item) => item.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...newIds])));
  };

  const handleBulkStatus = async (status: RFQStatus) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await fetch(`/api/rfqs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    }
    setSelectedIds([]);
    router.refresh();
  };

  const saveCurrentPreset = async () => {
    const name = window.prompt('Preset name');
    if (!name || !name.trim()) return;
    const res = await fetch('/api/admin/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        scope: 'RFQS',
        state: currentState,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    const preset: RfqPreset = { id: data.view.id, name: data.view.name, state: data.view.state };
    setPresets((prev) => [preset, ...prev].slice(0, 10));
    setSelectedPresetId(preset.id);
  };

  const applyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'none') {
      clearFilters();
      return;
    }
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    applyState(preset.state);
  };

  const removePreset = async () => {
    if (selectedPresetId === 'none') return;
    const res = await fetch(`/api/admin/views/${selectedPresetId}`, { method: 'DELETE' });
    if (!res.ok) return;
    setPresets((prev) => prev.filter((item) => item.id !== selectedPresetId));
    setSelectedPresetId('none');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-10">
        <LoadingState message="Loading RFQ inbox..." />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <section className="rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-6 text-white md:p-9">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <ClipboardList className="h-4 w-4" />
          {variant === 'insights' ? 'Admin insights' : 'Admin RFQ inbox'}
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">
          {variant === 'insights' ? 'Operations performance dashboard' : 'Triage and execution control'}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
          {variant === 'insights'
            ? 'Executive, commercial, and revenue metrics across your RFQ pipeline.'
            : 'Prioritize urgent opportunities, monitor offer coverage, and route each request into an execution workspace.'}
        </p>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-200">Total RFQs</p>
            <p className="mt-1 text-xl font-bold">{counts.total}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-200">Active pipeline</p>
            <p className="mt-1 text-xl font-bold">{counts.active}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-200">Urgent</p>
            <p className="mt-1 text-xl font-bold">{counts.urgent}</p>
          </div>
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-200">No offer yet</p>
            <p className="mt-1 text-xl font-bold">{counts.waitingForOffer}</p>
          </div>
        </div>
      </section>

      <section className="section-card mt-6">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Executive insights</h2>
        </div>
        {executiveInsights?.summary ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Offer coverage</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{executiveInsights.summary.offerCoverageRate}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Win rate</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{executiveInsights.summary.winRate}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Avg first offer</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{executiveInsights.summary.avgFirstOfferHours ?? '-'}h</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Mandate completeness</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{executiveInsights.summary.avgMandateCompleteness ?? '-'}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Weekly throughput</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                {executiveInsights.trend.slice(-4).map((week) => (
                  <span key={week.weekStart} className="rounded-full bg-background px-2 py-1">
                    {week.weekStart}: +{week.created} / -{week.closed}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Backlog by tier</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                {executiveInsights.backlog.map((tier) => (
                  <span key={tier.serviceTier} className="rounded-full bg-background px-2 py-1">
                    {tier.serviceTier}: {tier.open} open / {tier.overdue} overdue
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Executive insights loading" description="Aggregated metrics will appear here shortly." className="p-6" />
        )}
      </section>

      <section className="section-card mt-6">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Revenue opportunities</h2>
        </div>
        {revenueOpportunities?.summary ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Weighted pipeline value</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{revenueOpportunities.summary.weightedPipelineValue}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Core share</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{revenueOpportunities.summary.coreShare}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Upgrade rate</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{revenueOpportunities.summary.upgradeRate}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Upgrades / downgrades</p>
              <p className="mt-1 text-xl font-bold text-slate-900">
                {revenueOpportunities.summary.upgrades} / {revenueOpportunities.summary.downgradeCount}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Package mix</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                {revenueOpportunities.packageMix.map((pkg) => (
                  <span key={pkg.package} className="rounded-full bg-background px-2 py-1">
                    {pkg.package}: {pkg.count}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Upgrade conversion by tier</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                {revenueOpportunities.conversionByTier.map((row) => (
                  <span key={row.tier} className="rounded-full bg-background px-2 py-1">
                    {row.tier}: {row.upgrades}/{row.total} ({row.upgradeRate}%)
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Top add-ons</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                {revenueOpportunities.addonMix.length === 0 ? (
                  <span className="rounded-full bg-background px-2 py-1">No add-ons attached yet</span>
                ) : (
                  revenueOpportunities.addonMix.slice(0, 6).map((item) => (
                    <span key={item.addon} className="rounded-full bg-background px-2 py-1">
                      {item.addon}: {item.count}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Upsell candidates</p>
              <div className="mt-2 space-y-1 text-xs text-slate-700">
                {revenueOpportunities.upsellCandidates.length === 0 ? (
                  <p>No active Core-package upsell candidates.</p>
                ) : (
                  revenueOpportunities.upsellCandidates.slice(0, 6).map((candidate) => (
                    <Link key={candidate.rfqId} href={`/admin/rfqs/${candidate.rfqId}`} className="block rounded-md bg-background px-2 py-1 hover:bg-muted/50">
                      {candidate.rfqId.slice(0, 12)}... • {candidate.reason}
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <EmptyState title="Revenue opportunity insights loading" description="Package mix and upsell opportunities will appear here." className="p-6" />
        )}
      </section>

      <section className="section-card mt-6">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-slate-600" />
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Commercial effectiveness</h2>
        </div>
        {commercialInsights?.summary ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Offer coverage</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{commercialInsights.summary.offerCoverageRate}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Win rate</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{commercialInsights.summary.winRate}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Loss rate</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{commercialInsights.summary.lostRate}%</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tracked RFQs</p>
              <p className="mt-1 text-xl font-bold text-slate-900">{commercialInsights.summary.totalRfqs}</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Tier matrix</p>
              <div className="mt-2 space-y-1 text-xs text-slate-700">
                {commercialInsights.tierPerformance.map((tier) => (
                  <p key={tier.tier}>
                    {tier.tier}: {tier.rfqCount} RFQs • coverage {tier.offerCoverage}% • win {tier.winRate}% • avg ${tier.avgOfferPrice ?? '-'}
                  </p>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-muted/20 p-3 md:col-span-2">
              <p className="text-xs uppercase tracking-wide text-slate-500">Response speed distribution</p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-700">
                {commercialInsights.responseDistribution.map((bucket) => (
                  <span key={bucket.bucket} className="rounded-full bg-background px-2 py-1">
                    {bucket.bucket}: {bucket.count}
                  </span>
                ))}
              </div>
              {commercialInsights.lossReasons.length > 0 ? (
                <p className="mt-2 text-xs text-slate-600">
                  Top loss reason: {commercialInsights.lossReasons[0].reason} ({commercialInsights.lossReasons[0].count})
                </p>
              ) : null}
            </div>
          </div>
        ) : (
          <EmptyState title="Commercial insights loading" description="Coverage and win/loss analytics will appear here." className="p-6" />
        )}
      </section>

      <section className="section-card mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Conversion funnel</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
              Offer coverage {funnel.offerCoverageRate.toFixed(0)}%
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-1 font-semibold text-emerald-700">
              Win rate {funnel.winRate.toFixed(0)}%
            </span>
            <span className="rounded-full bg-blue-100 px-2 py-1 font-semibold text-blue-700">
              Avg first offer {funnel.avgFirstOfferHours.toFixed(1)}h
            </span>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {funnel.stages.map((stage) => {
            const pct = (stage.value / funnel.total) * 100;
            return (
              <div key={stage.label} className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">{stage.label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{stage.value}</p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
                </div>
                <p className="mt-1 text-xs text-slate-500">{pct.toFixed(0)}% of total</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="section-card mt-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">SLA escalations</h2>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/admin/settings">Tune policies</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                const res = await fetch('/api/admin/queue/escalations', { method: 'POST' });
                if (!res.ok) return;
                const refresh = await fetch('/api/admin/queue/escalations', { cache: 'no-store' });
                if (!refresh.ok) return;
                const data = await refresh.json();
                setEscalations(Array.isArray(data.items) ? data.items : []);
                setEscalationSummary(Array.isArray(data.summary) ? data.summary : []);
              }}
            >
              Run escalation alerts
            </Button>
          </div>
        </div>
        {escalationSummary.length > 0 ? (
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {escalationSummary.map((item) => (
              <div key={item.serviceTier} className="rounded-lg border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold text-slate-700">{item.serviceTier}</p>
                <p className="mt-1 text-xs text-slate-500">
                  warn {item.warningThresholdRatio}x / critical {item.criticalThresholdRatio}x
                </p>
                <p className="mt-2 text-xs text-slate-600">
                  {item.warningCount} warning, {item.criticalCount} critical
                </p>
              </div>
            ))}
          </div>
        ) : null}
        {escalations.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              title="No overdue SLA escalations"
              description="Everything is currently within configured warning thresholds."
              className="p-6"
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {escalations.slice(0, 6).map((item) => (
              <Link key={item.rfqId} href={`/admin/rfqs/${item.rfqId}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-muted/30">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.rfqId.slice(0, 12)}...</p>
                  <p className="text-xs text-slate-500">
                    {item.serviceTier} • {item.ageHours}h age / {item.slaTargetHours}h target
                  </p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.escalationLevel === 'critical' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                  {item.escalationLevel}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section-card mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Priority SLA queue</h2>
        {priorityQueue.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              title="Priority queue is clear"
              description="The queue will populate as new RFQs arrive."
              className="p-6"
            />
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {priorityQueue.map((item) => (
              <Link key={item.id} href={`/admin/rfqs/${item.id}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-muted/30">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.id.slice(0, 12)}...</p>
                  <p className="text-xs text-slate-500">
                    {item.category || 'Unknown'} • {item.serviceTier} • {item.ageHours}h age / {item.slaTargetHours}h target
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-semibold ${item.overdue ? 'text-rose-600' : 'text-slate-600'}`}>
                    {item.overdue ? 'Overdue' : 'On track'}
                  </p>
                  <p className="text-xs text-slate-500">Score {item.score}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="section-card mt-6">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">Supplier scorecards</h2>
        {scorecards.length === 0 ? (
          <div className="mt-2">
            <EmptyState
              title="No scorecards yet"
              description="Scorecards appear once enough offer history is available."
              className="p-6"
            />
          </div>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {scorecards.map((supplier) => (
              <div key={supplier.supplierId} className="rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-sm font-semibold text-slate-900">{supplier.supplierName}</p>
                <p className="text-xs text-slate-500">{supplier.country}</p>
                <div className="mt-2 space-y-1 text-xs text-slate-700">
                  <p>Offers: <strong>{supplier.offersSent}</strong></p>
                  <p>Acceptance: <strong>{supplier.acceptanceRate}%</strong></p>
                  <p>Win rate: <strong>{supplier.winRate}%</strong></p>
                  <p>Avg response: <strong>{supplier.avgResponseHours ?? '-'}h</strong></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {variant === 'insights' ? null : (
      <section className="section-card mt-6">
        <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative flex h-11 items-center rounded-xl border border-border bg-muted/40 px-3">
            <Search className="h-4 w-4 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search RFQ ID, category, country..."
              className="ml-2 h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </label>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortBy)}
            className="h-11 rounded-xl border border-border bg-muted/40 px-3 text-sm font-semibold text-slate-700"
          >
            <option value="Date">Sort by date</option>
            <option value="Country">Sort by country</option>
            <option value="Status">Sort by status</option>
            <option value="Urgency">Sort by urgency</option>
          </select>
          <select
            value={timeWindow}
            onChange={(event) => setTimeWindow(event.target.value as TimeWindow)}
            className="h-11 rounded-xl border border-border bg-muted/40 px-3 text-sm font-semibold text-slate-700"
          >
            <option value="All">All time</option>
            <option value="Today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <div className="inline-flex items-center rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-slate-600">
            <Filter className="mr-2 h-4 w-4" />
            {filtered.length} results
          </div>
        </div>

        <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <select
            value={selectedPresetId}
            onChange={(event) => applyPreset(event.target.value)}
            className="h-10 rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-slate-700"
          >
            <option value="none">No saved view</option>
            {presets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.name}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" className="h-10" onClick={saveCurrentPreset}>
            <Save className="mr-1 h-3.5 w-3.5" />
            Save current view
          </Button>
          <Button variant="ghost" size="sm" className="h-10" onClick={removePreset} disabled={selectedPresetId === 'none'}>
            Remove selected
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setUrgencyFilter((prev) => (prev === 'Urgent' ? 'All' : 'Urgent'))}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${urgencyFilter === 'Urgent' ? 'border-amber-400 bg-amber-50 text-amber-700' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
          >
            <TriangleAlert className="h-3.5 w-3.5" />
            Urgent only
          </button>
          <button
            onClick={() => setOfferStateFilter((prev) => (prev === 'No offers' ? 'All' : 'No offers'))}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${offerStateFilter === 'No offers' ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Needs offer
          </button>
          <button
            onClick={() => setOfferStateFilter((prev) => (prev === 'With offers' ? 'All' : 'With offers'))}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${offerStateFilter === 'With offers' ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
          >
            <Timer className="h-3.5 w-3.5" />
            Has offers
          </button>
          <button
            onClick={() => setWatchedOnly((prev) => !prev)}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${watchedOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
          >
            <Pin className="h-3.5 w-3.5" />
            Watched only
          </button>
          {(searchQuery || activeStatus !== 'All' || urgencyFilter !== 'All' || offerStateFilter !== 'All' || timeWindow !== 'All' || watchedOnly) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-1 h-3.5 w-3.5" />
              Reset filters
            </Button>
          )}
          {selectedIds.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleBulkStatus('In progress')}>
                Move to In progress ({selectedIds.length})
              </Button>
              <Button variant="destructive" size="sm" onClick={() => handleBulkStatus('Lost')}>
                Mark lost ({selectedIds.length})
              </Button>
            </>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveStatus(tab)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${activeStatus === tab ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background text-slate-600 hover:bg-muted/40'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </section>
      )}

      {filtered.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No RFQs match these filters"
            description="Try adjusting status, date window, or search terms."
            className="p-12"
          />
        </div>
      ) : (
        <>
          <div className="mt-6 hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
            <table className="w-full">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">
                    <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} />
                  </th>
                  <th className="px-4 py-3">RFQ</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Destination</th>
                  <th className="px-4 py-3">Urgency</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Offers</th>
                  <th className="px-4 py-3">SLA</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Watch</th>
                  <th className="px-4 py-3 text-right">Workspace</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rfq) => {
                  const offerCount = offers.filter((offer) => offer.rfqId === rfq.id).length;
                  const sla = getSlaState(rfq, offerCount);
                  return (
                    <tr key={rfq.id} className="stagger-item border-t border-border text-sm hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(rfq.id)} onChange={() => toggleSelected(rfq.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{rfq.id.slice(0, 12)}...</p>
                        <p className="line-clamp-1 text-xs text-slate-500">{rfq.keySpecs}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{rfq.category}</td>
                      <td className="px-4 py-3 text-slate-700">{rfq.deliveryCountry}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${rfq.urgency === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                          {rfq.urgency}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${rfq.serviceTier === 'Enterprise' ? 'bg-violet-100 text-violet-700' : rfq.serviceTier === 'Priority' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>
                          {rfq.serviceTier || 'Standard'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusStyles[rfq.status]}`}>{rfq.status}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-xs">{offerCount}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${sla.className}`}>{sla.label}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{formatDistanceToNow(new Date(rfq.createdAt), { addSuffix: true })}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleWatch(rfq.id)}
                          className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-xs font-semibold ${watchlistSet.has(rfq.id) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border text-slate-600 hover:bg-muted/50'}`}
                        >
                          <Pin className="mr-1 h-3.5 w-3.5" />
                          {watchlistSet.has(rfq.id) ? 'Watched' : 'Watch'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/rfqs/${rfq.id}`} className="text-sm font-semibold text-primary hover:underline">
                          Open
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 grid gap-3 lg:hidden">
            {filtered.map((rfq) => {
              const offerCount = offers.filter((offer) => offer.rfqId === rfq.id).length;
              const sla = getSlaState(rfq, offerCount);
              return (
                <div key={rfq.id} className="fx-lift rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{rfq.id.slice(0, 12)}...</p>
                      <p className="text-xs text-slate-500">{rfq.category} • {rfq.deliveryCountry}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedIds.includes(rfq.id)} onChange={() => toggleSelected(rfq.id)} />
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${statusStyles[rfq.status]}`}>{rfq.status}</span>
                    </div>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-slate-700">{rfq.keySpecs}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-1 font-semibold ${rfq.urgency === 'Urgent' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'}`}>
                      {rfq.urgency}
                    </span>
                    <span className={`rounded-full px-2 py-1 font-semibold ${rfq.serviceTier === 'Enterprise' ? 'bg-violet-100 text-violet-700' : rfq.serviceTier === 'Priority' ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-700'}`}>
                      {rfq.serviceTier || 'Standard'}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                      {offerCount} offers
                    </span>
                    <span className={`rounded-full px-2 py-1 font-semibold ${sla.className}`}>{sla.label}</span>
                    {watchlistSet.has(rfq.id) && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 font-semibold text-amber-700">
                        Watched
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{formatDistanceToNow(new Date(rfq.createdAt), { addSuffix: true })}</p>
                  <button
                    type="button"
                    onClick={() => toggleWatch(rfq.id)}
                    className={`mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg border text-xs font-semibold ${watchlistSet.has(rfq.id) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border text-slate-700'}`}
                  >
                    <Pin className="mr-1 h-3.5 w-3.5" />
                    {watchlistSet.has(rfq.id) ? 'Watched' : 'Watch'}
                  </button>
                  <Link href={`/admin/rfqs/${rfq.id}`} className="mt-3 inline-flex h-9 w-full items-center justify-center rounded-lg border border-border text-xs font-semibold text-slate-700">
                    Open workspace
                  </Link>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
