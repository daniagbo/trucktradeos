'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Activity, Cpu, Settings2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/data-state';

type AutomationRule = {
  id: string;
  name: string;
  triggerType: 'SLA_ESCALATION';
  actionType: 'NOTIFY_ADMIN';
  condition: {
    serviceTier?: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
    escalationLevel?: 'warning' | 'critical';
    minAgeHours?: number;
  };
  actionConfig: {
    titlePrefix?: string;
    messageSuffix?: string;
  };
  active: boolean;
  lastRunAt?: string | null;
};

type AutomationRun = {
  id: string;
  triggerType: string;
  source: string;
  status: string;
  notifications: number;
  tasksCreated: number;
  retries: number;
  dedupedCount: number;
  createdAt: string;
  errorMessage?: string | null;
};

export default function FleetSourceAdminAutomationPage() {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [runs, setRuns] = useState<AutomationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    serviceTier: 'STANDARD' as 'STANDARD' | 'PRIORITY' | 'ENTERPRISE',
    escalationLevel: 'warning' as 'warning' | 'critical',
    minAgeHours: 24,
    titlePrefix: 'Ops',
  });

  const load = async () => {
    setRefreshing(true);
    try {
      const [rulesRes, runsRes] = await Promise.all([
        fetch('/api/admin/automation-rules', { cache: 'no-store' }),
        fetch('/api/admin/automation-runs?limit=30', { cache: 'no-store' }),
      ]);
      if (rulesRes.ok) {
        const data = await rulesRes.json();
        setRules(Array.isArray(data.rules) ? data.rules : []);
      }
      if (runsRes.ok) {
        const data = await runsRes.json();
        setRuns(Array.isArray(data.runs) ? data.runs : []);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createRule = async () => {
    if (!ruleForm.name.trim()) return;
    setRuleSaving(true);
    try {
      const res = await fetch('/api/admin/automation-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: ruleForm.name.trim(),
          triggerType: 'SLA_ESCALATION',
          actionType: 'NOTIFY_ADMIN',
          condition: {
            serviceTier: ruleForm.serviceTier,
            escalationLevel: ruleForm.escalationLevel,
            minAgeHours: ruleForm.minAgeHours,
          },
          actionConfig: {
            titlePrefix: ruleForm.titlePrefix,
          },
          active: true,
        }),
      });
      if (!res.ok) return;
      setRuleForm((prev) => ({ ...prev, name: '' }));
      await load();
    } finally {
      setRuleSaving(false);
    }
  };

  const toggleRule = async (rule: AutomationRule) => {
    const res = await fetch('/api/admin/automation-rules', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rule.id, active: !rule.active }),
    });
    if (!res.ok) return;
    await load();
  };

  const runEscalations = async () => {
    const res = await fetch('/api/admin/queue/escalations', { method: 'POST' });
    if (!res.ok) return;
    await load();
  };

  return (
    <div className="page-shell">
      <section className="rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-6 text-white md:p-9">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <Cpu className="h-4 w-4" />
          Admin automations
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight md:text-4xl">Operations autopilot</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200 md:text-base">
          Configure escalation rules, observe reliability, and trigger runs to create tasks and notifications automatically.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={runEscalations}>
            Run SLA escalations
          </Button>
          <Button variant="outline" size="sm" onClick={() => void load()} disabled={refreshing}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Button asChild variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
            <Link href="/admin/settings">
              <Settings2 className="mr-2 h-4 w-4" />
              Policies & team
            </Link>
          </Button>
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle>Automation rules</CardTitle>
            <CardDescription>Create trigger-based escalation notifications for operations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">New rule</p>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Rule name"
                  value={ruleForm.name}
                  onChange={(event) => setRuleForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
                <input
                  type="number"
                  min={0}
                  max={720}
                  value={ruleForm.minAgeHours}
                  onChange={(event) => setRuleForm((prev) => ({ ...prev, minAgeHours: Number(event.target.value) || 0 }))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
                <select
                  value={ruleForm.serviceTier}
                  onChange={(event) => setRuleForm((prev) => ({ ...prev, serviceTier: event.target.value as 'STANDARD' | 'PRIORITY' | 'ENTERPRISE' }))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="STANDARD">STANDARD</option>
                  <option value="PRIORITY">PRIORITY</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
                <select
                  value={ruleForm.escalationLevel}
                  onChange={(event) => setRuleForm((prev) => ({ ...prev, escalationLevel: event.target.value as 'warning' | 'critical' }))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="warning">warning</option>
                  <option value="critical">critical</option>
                </select>
              </div>
              <div className="mt-2 flex justify-end">
                <Button size="sm" onClick={createRule} disabled={ruleSaving}>
                  {ruleSaving ? 'Creating...' : 'Create rule'}
                </Button>
              </div>
            </div>

            {loading ? (
              <EmptyState title="Loading rules" description="Fetching automation rules..." className="p-6" />
            ) : rules.length === 0 ? (
              <EmptyState title="No automation rules configured" description="Create your first rule to automate escalation notifications." className="p-6" />
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                    <p className="text-xs text-slate-500">
                      {rule.condition?.serviceTier || 'ANY'} • {rule.condition?.escalationLevel || 'ANY'} • min {rule.condition?.minAgeHours ?? 0}h
                    </p>
                    {rule.lastRunAt ? (
                      <p className="mt-1 text-[11px] text-slate-500">
                        Last run {new Date(rule.lastRunAt).toLocaleString()}
                      </p>
                    ) : null}
                  </div>
                  <Button size="sm" variant="outline" onClick={() => toggleRule(rule)}>
                    {rule.active ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle>Automation run logs</CardTitle>
            <CardDescription>Reliability view for trigger execution, dedupe, and task creation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <EmptyState title="Loading runs" description="Fetching automation execution history..." className="p-6" />
            ) : runs.length === 0 ? (
              <EmptyState title="No automation runs yet" description="Trigger an escalation run to populate the execution log." className="p-6" />
            ) : (
              runs.map((run) => (
                <div key={run.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{run.triggerType}</p>
                      <Badge variant="outline" className={run.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700' : run.status === 'FAILED' ? 'bg-rose-50 text-rose-700' : ''}>
                        {run.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    <Activity className="mr-1 inline h-3.5 w-3.5" />
                    Notifications {run.notifications} • Tasks {run.tasksCreated} • Dedupe {run.dedupedCount} • Retries {run.retries}
                  </p>
                  {run.errorMessage ? <p className="mt-2 text-xs text-rose-600">{run.errorMessage}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

