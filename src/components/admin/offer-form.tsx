'use client';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { RFQ } from '@/lib/types';
import { useRfqs } from '@/hooks/use-rfqs';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar as CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Checkbox } from '../ui/checkbox';

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

const includedOptions = [
    { id: 'inspection', label: 'Pre-sale Inspection' },
    { id: 'transport', label: 'Transport Arrangement' },
    { id: 'customs', label: 'Customs Clearance' },
];

export default function OfferForm({ rfq, onFinished }: OfferFormProps) {
  const { addOffer } = useRfqs();

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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Offer Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
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
                <Button variant={"outline"} className={cn("w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
            </FormControl></PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent>
            </Popover><FormMessage />
            </FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send Offer
          </Button>
        </div>
      </form>
    </Form>
  );
}
