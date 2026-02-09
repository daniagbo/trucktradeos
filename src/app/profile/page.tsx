'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Building2, Loader2, Mail, Phone, ShieldCheck, Trophy } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const profileSchema = z.object({
  accountType: z.enum(['individual', 'company']),
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().optional(),
  country: z.string().min(2, { message: 'Country is required.' }),
  companyName: z.string().optional(),
  vat: z.string().optional(),
  headline: z.string().max(120).optional(),
  bio: z.string().max(2000).optional(),
  website: z.string().url().or(z.literal('')).optional(),
  linkedinUrl: z.string().url().or(z.literal('')).optional(),
});

type TrackRecord = {
  totalRfqs: number;
  activeRfqs: number;
  closedRfqs: number;
  wonRfqs: number;
  lostRfqs: number;
  winRate: number;
  offersReceived: number;
  avgFirstOfferHours: number | null;
  profileCompleteness: number;
  trustScore: number;
  trustBreakdown?: {
    profileCompleteness: number;
    reliabilityScore: number;
    outcomesScore: number;
    engagementScore: number;
  };
  badges: string[];
};

export default function ProfilePage() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();
  const [trackRecord, setTrackRecord] = useState<TrackRecord | null>(null);
  const [trackRecordLoading, setTrackRecordLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      accountType: 'individual',
      name: '',
      phone: '',
      country: '',
      companyName: '',
      vat: '',
      headline: '',
      bio: '',
      website: '',
      linkedinUrl: '',
    },
  });

  const selectedAccountType = form.watch('accountType');

  const shouldShowCompanyFields = useMemo(
    () => selectedAccountType === 'company',
    [selectedAccountType]
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
      return;
    }
    if (user) {
      form.reset({
        accountType: user.accountType || 'individual',
        name: user.name || '',
        phone: user.phone || '',
        country: user.country || '',
        companyName: user.companyName || '',
        vat: user.vat || '',
        headline: user.headline || '',
        bio: user.bio || '',
        website: user.website || '',
        linkedinUrl: user.linkedinUrl || '',
      });
    }
  }, [loading, user, router, form]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadTrackRecord = async () => {
      try {
        setTrackRecordLoading(true);
        const res = await fetch('/api/auth/track-record', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (active) {
          setTrackRecord(data.trackRecord || null);
        }
      } catch (error) {
        console.error('Failed to load track record:', error);
      } finally {
        if (active) setTrackRecordLoading(false);
      }
    };
    void loadTrackRecord();
    return () => {
      active = false;
    };
  }, [user]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    const success = await updateProfile(values);
    if (success) {
      form.reset(values);
    }
  }

  const requiresPasswordReset = Boolean(user?.mustChangePassword);

  const submitPasswordChange = async () => {
    setPasswordMessage(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('New password and confirmation do not match.');
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await fetch('/api/auth/password/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordMessage(data.message || 'Failed to change password.');
        return;
      }
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordMessage('Password updated successfully.');
      router.refresh();
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="h-36 w-full rounded-3xl" />
        <Skeleton className="mt-6 h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <section className="rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-7 text-white md:p-9">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
          <ShieldCheck className="h-4 w-4" />
          Profile settings
        </div>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight">Account profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-200">
          Keep your company and contact details accurate so sourcing and deal communication remains smooth.
        </p>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <aside className="space-y-4 rounded-2xl border border-border bg-card p-5 lg:col-span-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Current account</h2>
          <div className="space-y-3 text-sm text-slate-700">
            <p className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" />
              {user.email}
            </p>
            <p className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {selectedAccountType === 'company' ? 'Company account' : 'Individual account'}
            </p>
            <p className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" />
              {user.phone || 'No phone added'}
            </p>
          </div>
          <div className="border-t border-border pt-4">
            <h3 className="text-sm font-semibold text-slate-800">Track record</h3>
            {trackRecordLoading ? (
              <p className="mt-2 text-xs text-slate-500">Loading metrics...</p>
            ) : trackRecord ? (
              <div className="mt-2 space-y-2 text-xs text-slate-700">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-700">Trust score</p>
                  <p className="text-lg font-bold text-emerald-700">{trackRecord.trustScore}/100</p>
                </div>
                <p>Total RFQs: <strong>{trackRecord.totalRfqs}</strong></p>
                <p>Offers received: <strong>{trackRecord.offersReceived}</strong></p>
                <p>Win rate: <strong>{trackRecord.winRate}%</strong></p>
                <p>Profile completeness: <strong>{trackRecord.profileCompleteness}%</strong></p>
                {trackRecord.trustBreakdown ? (
                  <div className="space-y-1 rounded-lg border border-border bg-muted/30 p-2 text-[11px]">
                    <p>Reliability: <strong>{trackRecord.trustBreakdown.reliabilityScore}%</strong></p>
                    <p>Outcomes: <strong>{trackRecord.trustBreakdown.outcomesScore}%</strong></p>
                    <p>Engagement: <strong>{trackRecord.trustBreakdown.engagementScore}%</strong></p>
                  </div>
                ) : null}
                {trackRecord.badges.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {trackRecord.badges.map((badge) => (
                      <span key={badge} className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No metrics yet.</p>
            )}
          </div>
        </aside>

        <section className="rounded-2xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900">Edit details</h2>
          <p className="mt-1 text-sm text-slate-600">Changes save directly to the backend profile.</p>

          {requiresPasswordReset ? (
            <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 p-4">
              <p className="text-sm font-semibold text-rose-700">Password change required</p>
              <p className="mt-1 text-xs text-rose-700">
                Your account has a temporary password. Set a new secure password before continuing.
              </p>
            </div>
          ) : null}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <FormField
                control={form.control}
                name="accountType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile type</FormLabel>
                    <FormControl>
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="individual">Individual</option>
                        <option value="company">Organization</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl><Input {...field} placeholder="e.g. Fleet procurement lead for EU routes" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{shouldShowCompanyFields ? 'Contact person' : 'Full name'}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl><Input value={user.email} disabled /></FormControl>
              </FormItem>

              {shouldShowCompanyFields && (
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company name</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone number</FormLabel>
                      <FormControl><Input {...field} placeholder="+1 234 567 890" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl><Input {...field} placeholder="Country" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {shouldShowCompanyFields && (
                <FormField
                  control={form.control}
                  name="vat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VAT / registration number</FormLabel>
                      <FormControl><Input {...field} placeholder="e.g. NL123456789B01" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl><Input {...field} placeholder="https://example.com" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn profile</FormLabel>
                    <FormControl><Input {...field} placeholder="https://linkedin.com/in/..." /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About</FormLabel>
                    <FormControl>
                      <textarea
                        {...field}
                        rows={5}
                        placeholder="Describe your organization, sourcing focus, and operating regions."
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {trackRecord && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
                    <Trophy className="h-4 w-4" />
                    Trust profile score
                  </p>
                  <p className="mt-1 text-xs text-emerald-800">
                    {trackRecord.profileCompleteness}% complete. Higher completeness improves prioritization in managed sourcing workflows.
                  </p>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save profile
                </Button>
              </div>
            </form>
          </Form>

          <div className="mt-8 rounded-xl border border-border bg-muted/20 p-4">
            <h3 className="text-sm font-semibold text-slate-900">Security: change password</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <Input
                type="password"
                placeholder="Current password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                }
              />
              <Input
                type="password"
                placeholder="New password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))
                }
              />
              <Input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))
                }
              />
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Must include uppercase, lowercase, number, and special character.
              </p>
              <Button size="sm" onClick={submitPasswordChange} disabled={passwordSaving}>
                {passwordSaving ? 'Updating...' : 'Update password'}
              </Button>
            </div>
            {passwordMessage ? <p className="mt-2 text-xs text-slate-600">{passwordMessage}</p> : null}
          </div>
        </section>
      </div>
    </div>
  );
}
