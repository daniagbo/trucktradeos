'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RFQ } from '@/lib/types';
import { useRfqs } from '@/hooks/use-rfqs';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Loader2, Save, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '../ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const offerSchema = z.object({
  rfqId: z.string(),
  listingId: z.string().optional(),
  title: z.string().min(5, "Title is required."),
  price: z.coerce.number().optional(),
  currency: z.string().optional().default('USD'),
  terms: z.string().optional(),
  location: z.string().optional(),
  availabilityText: z.string().optional(),
  validUntil: z.date(),
  includedFlags: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

type OfferFormValues = z.infer<typeof offerSchema>;

interface OfferFormProps {
  rfq: RFQ;
  onFinished: () => void;
}

type OfferTemplate = {
  id: string;
  name: string;
  category: string | null;
  title: string;
  currency: string;
  terms: string | null;
  location: string | null;
  availabilityText: string | null;
  includedFlags: Record<string, boolean>;
  notes: string | null;
  isDefault: boolean;
};

const includedOptions = [
    { id: 'inspection', label: 'Pre-sale Inspection' },
    { id: 'transport', label: 'Transport Arrangement' },
    { id: 'customs', label: 'Customs Clearance' },
];

export default function OfferForm({ rfq, onFinished }: OfferFormProps) {
  const { addOffer } = useRfqs();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<OfferTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerSchema),
    defaultValues: {
      rfqId: rfq.id,
      listingId: rfq.listingId,
      title: `Offer for ${rfq.category} Request`,
      validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      currency: 'USD',
      includedFlags: [],
    },
  });

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoadingTemplates(true);
        const response = await fetch(`/api/admin/offer-templates?category=${encodeURIComponent(rfq.category)}`, {
          cache: 'no-store',
        });
        if (!response.ok) return;
        const payload = await response.json() as { templates?: OfferTemplate[] };
        const nextTemplates = payload.templates || [];
        setTemplates(nextTemplates);
        const defaultTemplate = nextTemplates.find((template) => template.isDefault);
        if (defaultTemplate) {
          setSelectedTemplateId(defaultTemplate.id);
        }
      } catch (error) {
        console.error('Failed to load templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };

    void loadTemplates();
  }, [rfq.category]);

  const applyTemplate = (template: OfferTemplate) => {
    form.setValue('title', template.title, { shouldDirty: true });
    form.setValue('currency', template.currency, { shouldDirty: true });
    form.setValue('terms', template.terms || '', { shouldDirty: true });
    form.setValue('location', template.location || '', { shouldDirty: true });
    form.setValue('availabilityText', template.availabilityText || '', { shouldDirty: true });
    form.setValue('notes', template.notes || '', { shouldDirty: true });
    form.setValue(
      'includedFlags',
      Object.entries(template.includedFlags || {})
        .filter(([, value]) => value)
        .map(([key]) => key),
      { shouldDirty: true }
    );
  };

  const handleSaveAsTemplate = async () => {
    const name = window.prompt('Template name');
    if (!name || name.trim().length < 2) return;

    const values = form.getValues();
    const includedFlagsObject = values.includedFlags.reduce<Record<string, boolean>>((acc, flag) => {
      acc[flag] = true;
      return acc;
    }, {});

    try {
      setSavingTemplate(true);
      const response = await fetch('/api/admin/offer-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          category: rfq.category,
          title: values.title,
          currency: values.currency || 'USD',
          terms: values.terms || null,
          location: values.location || null,
          availabilityText: values.availabilityText || null,
          includedFlags: includedFlagsObject,
          notes: values.notes || null,
        }),
      });

      if (!response.ok) {
        toast({ variant: 'destructive', title: 'Template save failed' });
        return;
      }

      const payload = await response.json() as { template: OfferTemplate };
      setTemplates((prev) => [payload.template, ...prev]);
      setSelectedTemplateId(payload.template.id);
      toast({ title: 'Template saved' });
    } catch (error) {
      console.error('Failed to save template:', error);
      toast({ variant: 'destructive', title: 'Template save failed' });
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplateId) return;

    try {
      const response = await fetch(`/api/admin/offer-templates/${selectedTemplateId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        toast({ variant: 'destructive', title: 'Template delete failed' });
        return;
      }

      setTemplates((prev) => prev.filter((template) => template.id !== selectedTemplateId));
      setSelectedTemplateId('');
      toast({ title: 'Template deleted' });
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({ variant: 'destructive', title: 'Template delete failed' });
    }
  };

  async function onSubmit(data: OfferFormValues) {
    const includedFlagsObject = data.includedFlags.reduce((acc, flag) => {
        acc[flag] = true;
        return acc;
    }, {} as {[key: string]: boolean});
      
    await addOffer({
        ...data,
        validUntil: data.validUntil.toISOString(),
        includedFlags: includedFlagsObject,
    });
    onFinished();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-2 md:pr-4">
        <div className="rounded-xl border border-border bg-slate-50 p-3 space-y-3">
          <p className="text-sm font-medium text-slate-800">Offer templates</p>
          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]">
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder={loadingTemplates ? 'Loading templates...' : 'Select template'} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const template = templates.find((item) => item.id === selectedTemplateId);
                if (template) applyTemplate(template);
              }}
              disabled={!selectedTemplateId}
            >
              Apply
            </Button>
            <Button type="button" variant="outline" onClick={handleSaveAsTemplate} disabled={savingTemplate}>
              {savingTemplate ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save current
            </Button>
            <Button type="button" variant="outline" onClick={handleDeleteTemplate} disabled={!selectedTemplateId}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Offer Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="currency" render={({ field }) => (
                <FormItem><FormLabel>Currency</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
        <FormField control={form.control} name="validUntil" render={({ field }) => (
            <FormItem className="flex flex-col"><FormLabel>Valid Until</FormLabel>
            <Popover><PopoverTrigger asChild><FormControl>
                <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal rounded-xl", !field.value && "text-muted-foreground")}>
                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </FormControl></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
            </Popover><FormMessage />
            </FormItem>
        )} />
        <div className="grid gap-4 sm:grid-cols-2">
            <FormField control={form.control} name="terms" render={({ field }) => (
                <FormItem><FormLabel>Delivery Terms</FormLabel><FormControl><Input placeholder="e.g. EXW, DDP" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g. Rotterdam, NL" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
         <FormField control={form.control} name="availabilityText" render={({ field }) => (
            <FormItem><FormLabel>Availability</FormLabel><FormControl><Input placeholder="e.g. Available immediately" {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="includedFlags" render={() => (
          <FormItem>
            <div className="mb-4"><FormLabel>Included in Offer</FormLabel></div>
            {includedOptions.map((item) => (
              <FormField key={item.id} control={form.control} name="includedFlags"
                render={({ field }) => (
                  <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl><Checkbox checked={field.value?.includes(item.id)} onCheckedChange={(checked) => {
                        return checked ? field.onChange([...field.value, item.id]) : field.onChange(field.value?.filter((value) => value !== item.id))
                    }} /></FormControl>
                    <FormLabel className="font-normal">{item.label}</FormLabel>
                  </FormItem>
                )} />
            ))}
            <FormMessage />
          </FormItem>
        )} />
         <FormField control={form.control} name="notes" render={({ field }) => (
            <FormItem><FormLabel>Additional Notes</FormLabel><FormControl><Textarea rows={3} placeholder="Add any notes for the buyer." {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="flex justify-end pt-4">
          <Button className="rounded-xl" type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Offer
          </Button>
        </div>
      </form>
    </Form>
  );
}
