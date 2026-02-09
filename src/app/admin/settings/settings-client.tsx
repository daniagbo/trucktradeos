'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, Save, ShieldCheck, Users2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/data-state';

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MEMBER';
  teamRole: 'REQUESTER' | 'APPROVER' | 'MANAGER' | 'OWNER';
  mustChangePassword?: boolean;
};

type ApprovalPolicy = {
  id: string;
  serviceTier: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE';
  requiredApprovals: number;
  approverTeamRole: 'APPROVER' | 'MANAGER' | 'OWNER';
  autoAssignEnabled: boolean;
  warningThresholdRatio: number;
  criticalThresholdRatio: number;
  active: boolean;
};

type Organization = {
  id: string;
  name: string;
  slug: string;
} | null;

type TeamInvite = {
  id: string;
  email: string;
  name: string;
  teamRole: TeamMember['teamRole'];
  status: 'SENT' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';
  createdAt: string;
  expiresAt: string | null;
  invitedUserId: string | null;
};

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

const serviceTiers: Array<'STANDARD' | 'PRIORITY' | 'ENTERPRISE'> = ['STANDARD', 'PRIORITY', 'ENTERPRISE'];

export default function AdminSettingsClient() {
  const [organization, setOrganization] = useState<Organization>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([]);
  const [savingPolicy, setSavingPolicy] = useState<string | null>(null);
  const [savingMember, setSavingMember] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    teamRole: 'REQUESTER' as TeamMember['teamRole'],
  });
  const [inviteResult, setInviteResult] = useState<string | null>(null);
  const [resetResult, setResetResult] = useState<string | null>(null);
  const [invites, setInvites] = useState<TeamInvite[]>([]);
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [ruleSaving, setRuleSaving] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    name: '',
    serviceTier: 'STANDARD' as 'STANDARD' | 'PRIORITY' | 'ENTERPRISE',
    escalationLevel: 'warning' as 'warning' | 'critical',
    minAgeHours: 24,
    titlePrefix: 'Ops',
  });
  const [impactByTier, setImpactByTier] = useState<Record<string, {
    warningCount: number;
    criticalCount: number;
    totalActiveRfqs: number;
  }>>({});
  const [impactLoadingTier, setImpactLoadingTier] = useState<string | null>(null);
  const [simulationByTier, setSimulationByTier] = useState<Record<string, {
    sampleSize: number;
    current: { warningCount: number; criticalCount: number };
    proposed: { warningCount: number; criticalCount: number };
    delta: { warningCount: number; criticalCount: number };
  }>>({});
  const [runs, setRuns] = useState<AutomationRun[]>([]);

  const confirmHighRisk = (message: string) => {
    if (typeof window === 'undefined') return true;
    return window.confirm(message);
  };

  const loadData = async () => {
    const [policyRes, teamRes, invitesRes, rulesRes, runsRes] = await Promise.all([
      fetch('/api/admin/approval-policies', { cache: 'no-store' }),
      fetch('/api/admin/team-members', { cache: 'no-store' }),
      fetch('/api/admin/team-members/invite', { cache: 'no-store' }),
      fetch('/api/admin/automation-rules', { cache: 'no-store' }),
      fetch('/api/admin/automation-runs?limit=12', { cache: 'no-store' }),
    ]);
    if (policyRes.ok) {
      const data = await policyRes.json();
      setOrganization(data.organization || null);
      setPolicies(Array.isArray(data.policies) ? data.policies : []);
      if (Array.isArray(data.members)) setMembers(data.members);
    }
    if (teamRes.ok) {
      const data = await teamRes.json();
      if (Array.isArray(data.members)) setMembers(data.members);
    }
    if (invitesRes.ok) {
      const data = await invitesRes.json();
      setInvites(Array.isArray(data.invites) ? data.invites : []);
    }
    if (rulesRes.ok) {
      const data = await rulesRes.json();
      setRules(Array.isArray(data.rules) ? data.rules : []);
    }
    if (runsRes.ok) {
      const data = await runsRes.json();
      setRuns(Array.isArray(data.runs) ? data.runs : []);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const policyByTier = useMemo(() => {
    const map = new Map<string, ApprovalPolicy>();
    for (const policy of policies) map.set(policy.serviceTier, policy);
    return map;
  }, [policies]);

  const upsertPolicy = async (
    serviceTier: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE',
    update: Partial<ApprovalPolicy>
  ) => {
    if (!confirmHighRisk(`Apply approval policy updates for ${serviceTier}? This changes live routing and escalation behavior.`)) {
      return;
    }
    const current = policyByTier.get(serviceTier) || {
      id: '',
      serviceTier,
      requiredApprovals: serviceTier === 'ENTERPRISE' ? 2 : 1,
      approverTeamRole: serviceTier === 'ENTERPRISE' ? 'OWNER' : serviceTier === 'PRIORITY' ? 'MANAGER' : 'APPROVER',
      autoAssignEnabled: true,
      warningThresholdRatio: 1,
      criticalThresholdRatio: 1.5,
      active: true,
    };

    const payload = {
      serviceTier,
      requiredApprovals: update.requiredApprovals ?? current.requiredApprovals,
      approverTeamRole: update.approverTeamRole ?? current.approverTeamRole,
      autoAssignEnabled: update.autoAssignEnabled ?? current.autoAssignEnabled,
      warningThresholdRatio: update.warningThresholdRatio ?? current.warningThresholdRatio,
      criticalThresholdRatio: update.criticalThresholdRatio ?? current.criticalThresholdRatio,
      active: update.active ?? current.active,
    };

    setSavingPolicy(serviceTier);
    try {
      const res = await fetch('/api/admin/approval-policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return;
      const data = await res.json();
      const nextPolicy = data.policy as ApprovalPolicy;
      setPolicies((prev) => {
        const rest = prev.filter((item) => item.serviceTier !== serviceTier);
        return [...rest, nextPolicy];
      });
    } finally {
      setSavingPolicy(null);
    }
  };

  const updateMemberRole = async (userId: string, teamRole: TeamMember['teamRole']) => {
    setSavingMember(userId);
    try {
      const res = await fetch('/api/admin/team-members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, teamRole }),
      });
      if (!res.ok) return;
      const data = await res.json();
      setMembers((prev) =>
        prev.map((member) => (member.id === userId ? { ...member, teamRole: data.member.teamRole } : member))
      );
    } finally {
      setSavingMember(null);
    }
  };

  const resetMemberPassword = async (memberId: string) => {
    if (!confirmHighRisk('Reset this member password and issue new temporary credentials?')) return;
    setSavingMember(memberId);
    setResetResult(null);
    try {
      const res = await fetch(`/api/admin/team-members/${memberId}/reset-password`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setResetResult(data.message || 'Failed to reset password.');
        return;
      }
      setMembers((prev) =>
        prev.map((member) =>
          member.id === memberId ? { ...member, mustChangePassword: true } : member
        )
      );
      setResetResult(`Temporary password for ${data.member.email}: ${data.tempPassword}`);
    } finally {
      setSavingMember(null);
    }
  };

  const inviteMember = async () => {
    if (!inviteForm.name.trim() || !inviteForm.email.trim()) return;
    setInviting(true);
    setInviteResult(null);
    try {
      const res = await fetch('/api/admin/team-members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteForm.name.trim(),
          email: inviteForm.email.trim(),
          teamRole: inviteForm.teamRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setInviteResult(data.message || 'Failed to invite member.');
        return;
      }
      setMembers((prev) => {
        const without = prev.filter((member) => member.id !== data.member.id);
        return [...without, data.member];
      });
      setInviteResult(
        data.created
          ? `Member created. Temporary password: ${data.tempPassword}`
          : `Existing user linked and reset password issued: ${data.tempPassword}`
      );
      setInviteForm({ name: '', email: '', teamRole: 'REQUESTER' });
      await loadData();
    } finally {
      setInviting(false);
    }
  };

  const regenerateInvite = async (inviteId: string) => {
    const res = await fetch(`/api/admin/team-members/invites/${inviteId}`, { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      setResetResult(data.message || 'Failed to regenerate invite.');
      return;
    }
    setResetResult(`Invite regenerated. Temporary password: ${data.tempPassword}`);
    await loadData();
  };

  const revokeInvite = async (inviteId: string) => {
    if (!confirmHighRisk('Revoke this invite? The user will need a new invite to access the organization.')) return;
    const res = await fetch(`/api/admin/team-members/invites/${inviteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'REVOKED' }),
    });
    if (!res.ok) return;
    await loadData();
  };

  const previewImpact = async (tier: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE', policy: ApprovalPolicy) => {
    setImpactLoadingTier(tier);
    try {
      const params = new URLSearchParams({
        serviceTier: tier,
        warningThresholdRatio: String(policy.warningThresholdRatio),
        criticalThresholdRatio: String(policy.criticalThresholdRatio),
      });
      const res = await fetch(`/api/admin/approval-policies/impact?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      setImpactByTier((prev) => ({
        ...prev,
        [tier]: {
          warningCount: data.warningCount || 0,
          criticalCount: data.criticalCount || 0,
          totalActiveRfqs: data.totalActiveRfqs || 0,
        },
      }));
    } finally {
      setImpactLoadingTier(null);
    }
  };

  const runSimulation = async (tier: 'STANDARD' | 'PRIORITY' | 'ENTERPRISE', policy: ApprovalPolicy) => {
    const params = new URLSearchParams({
      serviceTier: tier,
      warningThresholdRatio: String(policy.warningThresholdRatio),
      criticalThresholdRatio: String(policy.criticalThresholdRatio),
    });
    const res = await fetch(`/api/admin/approval-policies/simulate?${params.toString()}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    setSimulationByTier((prev) => ({
      ...prev,
      [tier]: {
        sampleSize: data.sampleSize || 0,
        current: data.current || { warningCount: 0, criticalCount: 0 },
        proposed: data.proposed || { warningCount: 0, criticalCount: 0 },
        delta: data.delta || { warningCount: 0, criticalCount: 0 },
      },
    }));
  };

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
            titlePrefix: ruleForm.titlePrefix || undefined,
          },
          active: true,
        }),
      });
      if (!res.ok) return;
      setRuleForm({
        name: '',
        serviceTier: 'STANDARD',
        escalationLevel: 'warning',
        minAgeHours: 24,
        titlePrefix: 'Ops',
      });
      await loadData();
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
    await loadData();
  };

  return (
    <div className="page-shell">
      <Link href="/admin/rfqs" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
        <ArrowLeft className="h-4 w-4" />
        Back to admin
      </Link>

      <section className="section-card mb-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              <ShieldCheck className="h-4 w-4" />
              Admin settings
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900">Organization and Approval Controls</h1>
            <p className="mt-1 text-sm text-slate-600">Team roles, service-tier approval rules, and SLA escalation thresholds.</p>
          </div>
          {organization ? <Badge variant="outline">{organization.name}</Badge> : null}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1 rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-4 w-4" />
              Organization
            </CardTitle>
            <CardDescription>Current operating entity for admin workflows.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-slate-700">
            {organization ? (
              <div className="space-y-2">
                <p><strong>Name:</strong> {organization.name}</p>
                <p><strong>Slug:</strong> {organization.slug}</p>
                <p><strong>Members:</strong> {members.length}</p>
              </div>
            ) : (
              <p>No organization configured yet.</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 rounded-2xl border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users2 className="h-4 w-4" />
              Team Roles
            </CardTitle>
            <CardDescription>Assign who can request, approve, and manage approvals.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600">Invite member</p>
              <div className="grid gap-2 md:grid-cols-[1fr_1fr_180px_auto]">
                <input
                  type="text"
                  placeholder="Full name"
                  value={inviteForm.name}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
                <input
                  type="email"
                  placeholder="work@email.com"
                  value={inviteForm.email}
                  onChange={(event) => setInviteForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                />
                <select
                  value={inviteForm.teamRole}
                  onChange={(event) =>
                    setInviteForm((prev) => ({ ...prev, teamRole: event.target.value as TeamMember['teamRole'] }))
                  }
                  className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="APPROVER">Approver</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OWNER">Owner</option>
                </select>
                <Button size="sm" onClick={inviteMember} disabled={inviting}>
                  {inviting ? 'Inviting...' : 'Invite'}
                </Button>
              </div>
              {inviteResult ? <p className="mt-2 text-xs text-slate-600">{inviteResult}</p> : null}
              {resetResult ? <p className="mt-1 text-xs text-slate-600">{resetResult}</p> : null}
            </div>
            {members.map((member) => (
              <div key={member.id} className="flex flex-col gap-2 rounded-lg border border-border p-3 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{member.name}</p>
                  <p className="truncate text-xs text-slate-500">{member.email}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{member.role}</Badge>
                  {member.mustChangePassword ? <Badge variant="outline">Pwd reset required</Badge> : null}
                  <Select
                    value={member.teamRole}
                    onValueChange={(value: TeamMember['teamRole']) => updateMemberRole(member.id, value)}
                  >
                    <SelectTrigger className="h-9 w-full min-w-[140px] sm:w-[160px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="REQUESTER">Requester</SelectItem>
                      <SelectItem value="APPROVER">Approver</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="OWNER">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => resetMemberPassword(member.id)}
                    disabled={savingMember === member.id}
                    className="h-9"
                  >
                    Reset password
                  </Button>
                  {savingMember === member.id ? <span className="text-xs text-slate-500">Saving...</span> : null}
                </div>
              </div>
            ))}
            {members.length === 0 ? <p className="text-sm text-slate-500">No team members found.</p> : null}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 rounded-2xl border-border">
        <CardHeader>
          <CardTitle>Service Tier Approval Policies</CardTitle>
          <CardDescription>Controls approval depth, approver role, and SLA escalation sensitivity per tier.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {serviceTiers.map((tier) => {
            const policy = policyByTier.get(tier) || {
              id: '',
              serviceTier: tier,
              requiredApprovals: tier === 'ENTERPRISE' ? 2 : 1,
              approverTeamRole: tier === 'ENTERPRISE' ? 'OWNER' : tier === 'PRIORITY' ? 'MANAGER' : 'APPROVER',
              autoAssignEnabled: true,
              warningThresholdRatio: 1,
              criticalThresholdRatio: 1.5,
              active: true,
            };
            return (
              <div key={tier} className="rounded-xl border border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900">{tier}</h3>
                  <Badge variant="outline">{policy.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Required approvals
                    <input
                      type="number"
                      min={1}
                      max={5}
                      defaultValue={policy.requiredApprovals}
                      onBlur={(event) =>
                        upsertPolicy(tier, {
                          requiredApprovals: Math.max(1, Math.min(5, Number(event.target.value) || 1)),
                        })
                      }
                      className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Approver role
                    <select
                      defaultValue={policy.approverTeamRole}
                      onChange={(event) =>
                        upsertPolicy(tier, {
                          approverTeamRole: event.target.value as ApprovalPolicy['approverTeamRole'],
                        })
                      }
                      className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="APPROVER">Approver</option>
                      <option value="MANAGER">Manager</option>
                      <option value="OWNER">Owner</option>
                    </select>
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Auto assign
                    <select
                      defaultValue={policy.autoAssignEnabled ? 'yes' : 'no'}
                      onChange={(event) => upsertPolicy(tier, { autoAssignEnabled: event.target.value === 'yes' })}
                      className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="yes">Enabled</option>
                      <option value="no">Disabled</option>
                    </select>
                  </label>
                </div>
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Warning threshold ratio
                    <input
                      type="number"
                      min={0.5}
                      max={3}
                      step={0.1}
                      defaultValue={policy.warningThresholdRatio}
                      onBlur={(event) =>
                        upsertPolicy(tier, {
                          warningThresholdRatio: Math.max(0.5, Math.min(3, Number(event.target.value) || 1)),
                        })
                      }
                      className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Critical threshold ratio
                    <input
                      type="number"
                      min={1}
                      max={4}
                      step={0.1}
                      defaultValue={policy.criticalThresholdRatio}
                      onBlur={(event) =>
                        upsertPolicy(tier, {
                          criticalThresholdRatio: Math.max(1, Math.min(4, Number(event.target.value) || 1.5)),
                        })
                      }
                      className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    />
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Policy status
                    <select
                      defaultValue={policy.active ? 'active' : 'inactive'}
                      onChange={(event) => upsertPolicy(tier, { active: event.target.value === 'active' })}
                      className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>
                <div className="mt-3 flex items-center justify-end">
                  <div className="mr-auto">
                    {impactByTier[tier] ? (
                      <p className="text-xs text-slate-600">
                        Impact preview: {impactByTier[tier].warningCount} warning / {impactByTier[tier].criticalCount} critical out of {impactByTier[tier].totalActiveRfqs} active RFQs.
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">Run impact preview before saving major threshold changes.</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => previewImpact(tier, policy)}
                    disabled={impactLoadingTier === tier}
                  >
                    {impactLoadingTier === tier ? 'Analyzing...' : 'Preview impact'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => runSimulation(tier, policy)}
                  >
                    Simulate
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => upsertPolicy(tier, {})} disabled={savingPolicy === tier}>
                    <Save className="mr-2 h-4 w-4" />
                    {savingPolicy === tier ? 'Saving...' : 'Save tier policy'}
                  </Button>
                </div>
                {simulationByTier[tier] ? (
                  <p className="mt-2 text-xs text-slate-600">
                    Simulation ({simulationByTier[tier].sampleSize} RFQs): warning {simulationByTier[tier].current.warningCount} → {simulationByTier[tier].proposed.warningCount} ({simulationByTier[tier].delta.warningCount >= 0 ? '+' : ''}{simulationByTier[tier].delta.warningCount}), critical {simulationByTier[tier].current.criticalCount} → {simulationByTier[tier].proposed.criticalCount} ({simulationByTier[tier].delta.criticalCount >= 0 ? '+' : ''}{simulationByTier[tier].delta.criticalCount})
                  </p>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-border">
          <CardHeader>
            <CardTitle>Invite lifecycle</CardTitle>
            <CardDescription>Track sent, accepted, or revoked invites and regenerate credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {invites.length === 0 ? (
              <EmptyState title="No invite events yet" description="Invites will appear here once you start onboarding members." className="p-6" />
            ) : (
              invites.slice(0, 8).map((invite) => (
                <div key={invite.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{invite.name} ({invite.email})</p>
                    <Badge
                      variant="outline"
                      className={
                        invite.status === 'ACCEPTED'
                          ? 'bg-emerald-50 text-emerald-700'
                          : invite.status === 'REVOKED'
                            ? 'bg-rose-50 text-rose-700'
                            : invite.status === 'EXPIRED'
                              ? 'bg-amber-50 text-amber-700'
                              : ''
                      }
                    >
                      {invite.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Role {invite.teamRole} • {new Date(invite.createdAt).toLocaleString()}
                  </p>
                  {invite.status === 'SENT' ? (
                    <div className="mt-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => regenerateInvite(invite.id)}>
                        Regenerate
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => revokeInvite(invite.id)}>
                        Revoke
                      </Button>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

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
            {rules.length === 0 ? (
              <EmptyState title="No automation rules configured" description="Create your first rule to automate escalation notifications." className="p-6" />
            ) : (
              rules.map((rule) => (
                <div key={rule.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{rule.name}</p>
                    <p className="text-xs text-slate-500">
                      {rule.condition?.serviceTier || 'ANY'} • {rule.condition?.escalationLevel || 'ANY'} • min {rule.condition?.minAgeHours ?? 0}h
                    </p>
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
            {runs.length === 0 ? (
              <EmptyState title="No automation runs yet" description="Run escalation alerts to populate the execution log." className="p-6" />
            ) : (
              runs.map((run) => (
                <div key={run.id} className="rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{run.triggerType} • {run.status}</p>
                    <p className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Notifications {run.notifications} • Tasks {run.tasksCreated} • Dedupe {run.dedupedCount} • Retries {run.retries}
                  </p>
                  {run.errorMessage ? <p className="mt-1 text-xs text-rose-600">{run.errorMessage}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
