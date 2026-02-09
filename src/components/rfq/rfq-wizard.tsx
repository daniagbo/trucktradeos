'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useRfqs } from '@/hooks/use-rfqs';
import type { Listing } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import SlaMessaging from '@/components/ui/sla-messaging';

const rfqSchema = z.object({
  listingId: z.string().optional(),
  category: z.enum(['Trailer', 'Truck', 'Heavy Equipment']),
  keySpecs: z.string().min(10, 'Please provide key specifications.'),
  preferredBrands: z.string().optional(),
  yearMin: z.coerce.number().optional(),
  yearMax: z.coerce.number().optional(),
  budgetMin: z.coerce.number().optional(),
  budgetMax: z.coerce.number().optional(),
  deliveryCountry: z.string().min(2, 'Delivery country is required.'),
  pickupDeadline: z.date().optional(),
  urgency: z.enum(['Normal', 'Urgent']),
  serviceTier: z.enum(['Standard', 'Priority', 'Enterprise']).default('Standard'),
  servicePackage: z.enum(['Core', 'Concierge', 'Command']).default('Core'),
  packageAddons: z
    .array(z.enum(['Verification', 'Logistics', 'Financing', 'Compliance', 'DedicatedManager']))
    .default([]),
  requiredDocuments: z.array(z.string()).default([]),
  conditionTolerance: z.string().min(3, 'Condition tolerance is required'),
  businessGoal: z.string().min(5, 'Business goal is required'),
  riskTolerance: z.enum(['Low', 'Medium', 'High']).default('Medium'),
  budgetConfidence: z.enum(['Fixed', 'Flexible', 'Exploratory']).default('Flexible'),
  notes: z.string().optional(),
});

type RFQFormValues = z.infer<typeof rfqSchema>;
const documentOptions = ['Service History', 'Inspection Report', 'Registration', 'Title'];

function StepPill({ current, index, label }: { current: number; index: number; label: string }) {
  const active = current === index;
  const completed = current > index;
  return (
    <div
      className={cn(
        'rounded-xl border px-3 py-2 text-xs font-semibold uppercase tracking-wide',
        active && 'border-primary bg-primary/10 text-primary',
        completed && 'border-emerald-300 bg-emerald-50 text-emerald-700',
        !active && !completed && 'border-border bg-background text-slate-500'
      )}
    >
      {index}. {label}
    </div>
  );
}

interface RfqWizardProps {
  listing?: Listing;
}

export default function RfqWizard({ listing }: RfqWizardProps) {
  const [step, setStep] = useState(1);
  const { user } = useAuth();
  const { addRfq } = useRfqs();
  const router = useRouter();

  const form = useForm<RFQFormValues>({
    resolver: zodResolver(rfqSchema),
    defaultValues: {
      listingId: listing?.id,
      category: listing?.category || 'Truck',
      keySpecs: listing ? `Similar to ${listing.title}` : '',
      preferredBrands: listing?.brand || '',
      yearMin: listing?.year,
      deliveryCountry: user?.country || '',
      urgency: 'Normal',
      serviceTier: 'Standard',
      servicePackage: 'Core',
      packageAddons: [],
      requiredDocuments: [],
      conditionTolerance: listing?.condition || '',
      businessGoal: '',
      riskTolerance: 'Medium',
      budgetConfidence: 'Flexible',
      notes: '',
    },
  });

  const selectedTier = form.watch('serviceTier');
  const selectedPackage = form.watch('servicePackage');
  const selectedAddons = form.watch('packageAddons') || [];
  const monthlyBaseByPackage: Record<'Core' | 'Concierge' | 'Command', number> = {
    Core: 0,
    Concierge: 900,
    Command: 2400,
  };
  const tierMultiplier: Record<'Standard' | 'Priority' | 'Enterprise', number> = {
    Standard: 1,
    Priority: 1.35,
    Enterprise: 1.9,
  };
  const addonMonthly: Record<'Verification' | 'Logistics' | 'Financing' | 'Compliance' | 'DedicatedManager', number> = {
    Verification: 350,
    Logistics: 500,
    Financing: 300,
    Compliance: 450,
    DedicatedManager: 1200,
  };
  const monthlyEstimate =
    Math.round(monthlyBaseByPackage[selectedPackage] * tierMultiplier[selectedTier]) +
    selectedAddons.reduce((sum, addon) => sum + addonMonthly[addon], 0);

  const nextStep = async () => {
    const fieldsToValidate: (keyof RFQFormValues)[] =
      step === 1 ? ['category', 'keySpecs'] : ['deliveryCountry', 'urgency'];
    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  async function onSubmit(data: RFQFormValues) {
    if (!user) {
      form.setError('root', { message: 'You must be logged in to submit a request.' });
      return;
    }
    const newRfq = await addRfq({ ...data, userId: user.id });
    router.push(`/rfq/${newRfq.id}/confirmation`);
  }

  return (
    <Card className="mx-auto w-full max-w-4xl rounded-2xl border-border shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">New sourcing request</CardTitle>
        <CardDescription>Provide your requirements in three quick steps.</CardDescription>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          <StepPill current={step} index={1} label="Requirements" />
          <StepPill current={step} index={2} label="Delivery" />
          <StepPill current={step} index={3} label="Finalize" />
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {step === 1 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-slate-900">What are you sourcing?</h3>
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Truck">Truck</SelectItem>
                          <SelectItem value="Trailer">Trailer</SelectItem>
                          <SelectItem value="Heavy Equipment">Heavy Equipment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keySpecs"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Key specifications</FormLabel>
                      <FormControl>
                        <Textarea rows={4} placeholder="Transmission, power range, axle setup, mileage/hours, attachments..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="preferredBrands"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred brands</FormLabel>
                        <FormControl><Input placeholder="e.g. Scania, Volvo, Komatsu" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="yearMin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year min</FormLabel>
                          <FormControl><Input type="number" placeholder="2018" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="yearMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Year max</FormLabel>
                          <FormControl><Input type="number" placeholder="2024" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="budgetMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget min (EUR/USD)</FormLabel>
                        <FormControl><Input type="number" placeholder="50000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="budgetMax"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Budget max (EUR/USD)</FormLabel>
                        <FormControl><Input type="number" placeholder="80000" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-slate-900">Where and when?</h3>
                <FormField
                  control={form.control}
                  name="deliveryCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery country</FormLabel>
                      <FormControl><Input placeholder="e.g. Germany" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pickupDeadline"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Latest pickup date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}>
                              {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-60" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid gap-3 sm:grid-cols-2">
                          <FormItem className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <FormControl><RadioGroupItem value="Normal" /></FormControl>
                            <FormLabel className="m-0 cursor-pointer font-medium">Normal timeline</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <FormControl><RadioGroupItem value="Urgent" /></FormControl>
                            <FormLabel className="m-0 cursor-pointer font-medium">Urgent procurement</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="serviceTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service lane</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid gap-3 sm:grid-cols-3">
                          <FormItem className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <FormControl><RadioGroupItem value="Standard" /></FormControl>
                            <FormLabel className="m-0 cursor-pointer font-medium">Standard (72h)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <FormControl><RadioGroupItem value="Priority" /></FormControl>
                            <FormLabel className="m-0 cursor-pointer font-medium">Priority (24h)</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <FormControl><RadioGroupItem value="Enterprise" /></FormControl>
                            <FormLabel className="m-0 cursor-pointer font-medium">Enterprise (8h)</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="servicePackage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Managed-service package</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid gap-3 sm:grid-cols-3">
                          <FormItem className="rounded-xl border border-border p-3">
                            <div className="flex items-center gap-3">
                              <FormControl><RadioGroupItem value="Core" /></FormControl>
                              <FormLabel className="m-0 cursor-pointer font-medium">Core</FormLabel>
                            </div>
                            <p className="mt-2 text-xs text-slate-600">Best-effort sourcing and standard comms.</p>
                          </FormItem>
                          <FormItem className="rounded-xl border border-border p-3">
                            <div className="flex items-center gap-3">
                              <FormControl><RadioGroupItem value="Concierge" /></FormControl>
                              <FormLabel className="m-0 cursor-pointer font-medium">Concierge</FormLabel>
                            </div>
                            <p className="mt-2 text-xs text-slate-600">Proactive shortlist + negotiation support.</p>
                          </FormItem>
                          <FormItem className="rounded-xl border border-border p-3">
                            <div className="flex items-center gap-3">
                              <FormControl><RadioGroupItem value="Command" /></FormControl>
                              <FormLabel className="m-0 cursor-pointer font-medium">Command</FormLabel>
                            </div>
                            <p className="mt-2 text-xs text-slate-600">Dedicated manager + priority orchestration.</p>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">
                  <p className="font-semibold text-slate-900">Estimated managed-service spend</p>
                  <p className="mt-1 text-slate-700">
                    Package <strong>{selectedPackage}</strong> on <strong>{selectedTier}</strong> lane:
                    {' '}
                    <strong>${monthlyEstimate.toLocaleString()}/month</strong> (guidance estimate).
                  </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <h3 className="text-lg font-semibold text-slate-900">Finalize request</h3>
                <FormField
                  control={form.control}
                  name="packageAddons"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Optional add-ons</FormLabel>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          ['Verification', 'Deep supplier verification'],
                          ['Logistics', 'Cross-border logistics coordination'],
                          ['Financing', 'Financing partner introduction'],
                          ['Compliance', 'Compliance and document handling'],
                          ['DedicatedManager', 'Dedicated account manager'],
                        ].map(([value, label]) => (
                          <label key={value} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                            <Checkbox
                              checked={field.value?.includes(value as RFQFormValues['packageAddons'][number])}
                              onCheckedChange={(checked) => {
                                if (checked) field.onChange([...(field.value || []), value]);
                                else field.onChange((field.value || []).filter((item) => item !== value));
                              }}
                            />
                            <span>{label}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requiredDocuments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Required documents</FormLabel>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {documentOptions.map((item) => (
                          <label key={item} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                            <Checkbox
                              checked={field.value?.includes(item)}
                              onCheckedChange={(checked) => {
                                if (checked) field.onChange([...(field.value || []), item]);
                                else field.onChange((field.value || []).filter((value) => value !== item));
                              }}
                            />
                            <span>{item}</span>
                          </label>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="conditionTolerance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condition tolerance</FormLabel>
                      <FormControl><Input placeholder="e.g. Good or better, fully operational" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="businessGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business goal</FormLabel>
                        <FormControl><Input placeholder="e.g. add 20 tractors before Q3 contracts" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="riskTolerance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Risk tolerance</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="budgetConfidence"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget confidence</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Fixed">Fixed</SelectItem>
                          <SelectItem value="Flexible">Flexible</SelectItem>
                          <SelectItem value="Exploratory">Exploratory</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional notes</FormLabel>
                      <FormControl><Textarea rows={4} placeholder="Preferred payment terms, fleet mix, compliance requirements..." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-xl border border-border bg-muted/30 p-4">
                  <SlaMessaging />
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm">
                  <p className="font-semibold text-emerald-800">Commercial summary</p>
                  <p className="mt-1 text-emerald-700">
                    {selectedPackage} package + {selectedAddons.length} add-on{selectedAddons.length === 1 ? '' : 's'}
                    {' '}
                    with projected spend around <strong>${monthlyEstimate.toLocaleString()}/month</strong>.
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                {form.formState.errors.root && <p className="text-sm font-medium text-red-600">{form.formState.errors.root.message}</p>}
              </div>
              <div className="flex items-center gap-3">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={prevStep}>
                    Back
                  </Button>
                )}
                {step < 3 ? (
                  <Button type="button" onClick={nextStep}>Continue</Button>
                ) : (
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit sourcing request
                  </Button>
                )}
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
