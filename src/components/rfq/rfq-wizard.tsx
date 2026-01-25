'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useRfqs } from '@/hooks/use-rfqs';
import { useRouter } from 'next/navigation';
import { Listing } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon, Loader2 } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const rfqSchema = z.object({
    listingId: z.string().optional(),
    category: z.enum(['Trailer', 'Truck', 'Heavy Equipment']),
    keySpecs: z.string().min(10, 'Please provide some key specifications.'),
    preferredBrands: z.string().optional(),
    yearMin: z.coerce.number().optional(),
    yearMax: z.coerce.number().optional(),
    budgetMin: z.coerce.number().optional(),
    budgetMax: z.coerce.number().optional(),
    deliveryCountry: z.string().min(2, 'Delivery country is required.'),
    pickupDeadline: z.date().optional(),
    urgency: z.enum(['Normal', 'Urgent']),
    requiredDocuments: z.array(z.string()).default([]),
    conditionTolerance: z.string().min(3, "Condition tolerance is required"),
    notes: z.string().optional(),
});

type RFQFormValues = z.infer<typeof rfqSchema>;

const documentOptions = ['Service History', 'Inspection Report', 'Registration', 'Title'];

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
            requiredDocuments: [],
            conditionTolerance: listing?.condition || '',
        }
    });

    const nextStep = async () => {
        let fieldsToValidate: (keyof RFQFormValues)[] = [];
        if (step === 1) {
            fieldsToValidate = ['category', 'keySpecs'];
        } else if (step === 2) {
            fieldsToValidate = ['deliveryCountry', 'urgency'];
        }

        const isValid = await form.trigger(fieldsToValidate);
        if (isValid) {
            setStep(s => s + 1);
        }
    };
    const prevStep = () => setStep(s => s - 1);

    async function onSubmit(data: RFQFormValues) {
        if (!user) {
            form.setError('root', { message: 'You must be logged in to submit a request.' });
            return;
        }
        
        const newRfq = await addRfq({ ...data, userId: user.id });
        router.push(`/rfq/${newRfq.id}/confirmation`);
    }

    return (
        <Card className="w-full max-w-3xl mx-auto">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">New Sourcing Request</CardTitle>
                <CardDescription>Step {step} of 3 - Tell us what you need.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        {step === 1 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">What do you need?</h3>
                                <FormField control={form.control} name="category" render={({ field }) => (
                                    <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="Truck">Truck</SelectItem><SelectItem value="Trailer">Trailer</SelectItem><SelectItem value="Heavy Equipment">Heavy Equipment</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="keySpecs" render={({ field }) => (
                                    <FormItem><FormLabel>Key Specifications</FormLabel><FormControl><Textarea rows={4} placeholder="e.g., Automatic gearbox, sleeper cab, min. 450 HP..." {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="preferredBrands" render={({ field }) => (<FormItem><FormLabel>Preferred Brand(s)</FormLabel><FormControl><Input placeholder="e.g., Scania, Volvo" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <div className="grid grid-cols-2 gap-2 items-end">
                                    <FormField control={form.control} name="yearMin" render={({ field }) => (<FormItem><FormLabel>Year Range (Min)</FormLabel><FormControl><Input type="number" placeholder="2018" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="yearMax" render={({ field }) => (<FormItem><FormLabel> (Max)</FormLabel><FormControl><Input type="number" placeholder="2024" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                </div>
                                 <div className="grid grid-cols-2 gap-2 items-end">
                                    <FormField control={form.control} name="budgetMin" render={({ field }) => (<FormItem><FormLabel>Budget Range (Min)</FormLabel><FormControl><Input type="number" placeholder="50000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="budgetMax" render={({ field }) => (<FormItem><FormLabel> (Max)</FormLabel><FormControl><Input type="number" placeholder="80000" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                            </div>
                        )}
                        {step === 2 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Where & When?</h3>
                                 <FormField control={form.control} name="deliveryCountry" render={({ field }) => (<FormItem><FormLabel>Delivery Country</FormLabel><FormControl><Input placeholder="e.g., Germany" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                 <FormField control={form.control} name="pickupDeadline" render={({ field }) => (
                                     <FormItem className="flex flex-col"><FormLabel>Latest Pickup Date</FormLabel>
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
                                 <FormField control={form.control} name="urgency" render={({ field }) => (
                                     <FormItem><FormLabel>Urgency</FormLabel><FormControl>
                                         <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                             <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Normal" /></FormControl><FormLabel className="font-normal">Normal</FormLabel></FormItem>
                                             <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Urgent" /></FormControl><FormLabel className="font-normal">Urgent</FormLabel></FormItem>
                                         </RadioGroup>
                                     </FormControl><FormMessage /></FormItem>
                                 )} />
                            </div>
                        )}
                        {step === 3 && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg">Requirements & Notes</h3>
                                <FormField control={form.control} name="requiredDocuments" render={({ field }) => (
                                    <FormItem>
                                        <div className="mb-4"><FormLabel>Documents Required</FormLabel></div>
                                        {documentOptions.map((item) => (
                                            <FormField key={item} control={form.control} name="requiredDocuments"
                                            render={({ field }) => (
                                                <FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0">
                                                <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                                    return checked ? field.onChange([...field.value, item]) : field.onChange(field.value?.filter((value) => value !== item))
                                                }} /></FormControl>
                                                <FormLabel className="font-normal">{item}</FormLabel>
                                                </FormItem>
                                            )}
                                            />
                                        ))}
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="conditionTolerance" render={({ field }) => (
                                    <FormItem><FormLabel>Condition Tolerance</FormLabel><FormControl><Input placeholder="e.g., Good or better, must be operational" {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                                <FormField control={form.control} name="notes" render={({ field }) => (
                                    <FormItem><FormLabel>Additional Notes</FormLabel><FormControl><Textarea rows={4} placeholder="Any other details to help us find the right equipment for you." {...field} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>
                        )}

                        <div className="flex justify-between items-center pt-4">
                            {step > 1 && <Button type="button" variant="outline" onClick={prevStep}>Back</Button>}
                            <div/>
                            {step < 3 && <Button type="button" onClick={nextStep}>Next</Button>}
                            {step === 3 && <Button type="submit" disabled={form.formState.isSubmitting}>
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Sourcing Request
                                </Button>}
                        </div>
                        {form.formState.errors.root && <FormMessage>{form.formState.errors.root.message}</FormMessage>}
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
