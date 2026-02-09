'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter.' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character.' }),
  phone: z.string().optional(),
  country: z.string().min(2, { message: 'Country is required.' }),
  accountType: z.enum(['individual', 'company']),
  companyName: z.string().optional(),
  vat: z.string().optional(),
}).refine(data => {
    if (data.accountType === 'company') {
        return !!data.companyName;
    }
    return true;
}, {
    message: 'Company name is required for company accounts.',
    path: ['companyName'],
});

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
      country: '',
      accountType: 'individual',
      companyName: '',
      vat: '',
    },
  });

  const accountType = form.watch('accountType');

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    const success = await register(values);
    if (success) {
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    }
    setIsSubmitting(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="accountType"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Account Type</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="individual" />
                    </FormControl>
                    <FormLabel className="font-normal">Individual</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="company" />
                    </FormControl>
                    <FormLabel className="font-normal">Company</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                    <FormLabel>{accountType === 'company' ? 'Contact Person Name' : 'Full Name'}</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            {accountType === 'company' && (
                <FormField control={form.control} name="companyName" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl><Input placeholder="Doe Inc." {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            )}
        </div>
        
        <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl><Input type="email" placeholder="name@company.com" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <FormField control={form.control} name="password" render={({ field }) => (
            <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input type="password" placeholder="Minimum 8 characters" {...field} /></FormControl>
                <FormMessage />
            </FormItem>
        )} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl><Input placeholder="+1 234 567 890" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem>
                    <FormLabel>Country</FormLabel>
                     <FormControl><Input placeholder="e.g. Netherlands" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
        
        {accountType === 'company' && (
            <FormField control={form.control} name="vat" render={({ field }) => (
                <FormItem>
                    <FormLabel>VAT / KVK Number (Optional)</FormLabel>
                    <FormControl><Input placeholder="NL123456789B01" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        )}

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
