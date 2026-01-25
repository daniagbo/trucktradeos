'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().optional(),
  country: z.string().min(2, { message: 'Country is required.' }),
  companyName: z.string().optional(),
  vat: z.string().optional(),
}).refine(data => {
    if (data.companyName) { // Assuming if companyName is being edited, it's a company account
        return !!data.companyName;
    }
    return true;
}, {
    message: 'Company name is required for company accounts.',
    path: ['companyName'],
});

export default function ProfilePage() {
  const { user, loading, updateProfile } = useAuth();
  const router = useRouter();

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
        name: '', phone: '', country: '', companyName: '', vat: ''
    }
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/profile');
    }
    if (user) {
        form.reset({
            name: user.name || '',
            phone: user.phone || '',
            country: user.country || '',
            companyName: user.companyName || '',
            vat: user.vat || '',
        });
    }
  }, [user, loading, router, form]);

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    await updateProfile(values);
    form.reset(values); // Re-sync form with latest saved state
  }

  if (loading || !user) {
    return (
        <div className="container py-12">
            <div className="max-w-2xl mx-auto">
                <Skeleton className="h-10 w-1/3 mb-2" />
                <Skeleton className="h-6 w-2/3 mb-8" />
                <Skeleton className="h-96 w-full" />
            </div>
        </div>
    );
  }

  return (
    <div className="container py-12">
        <div className="max-w-2xl mx-auto">
            <h1 className="font-headline text-3xl font-bold tracking-tight">Profile</h1>
            <p className="text-muted-foreground mt-2">Manage your account and company details.</p>
            
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>This information will be used for communication and transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{user.accountType === 'company' ? 'Contact Person Name' : 'Full Name'}</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                            <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl><Input value={user.email} disabled /></FormControl>
                                <FormMessage />
                            </FormItem>

                            {user.accountType === 'company' && (
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl><Input {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="phone" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Phone Number</FormLabel>
                                        <FormControl><Input {...field} placeholder="Your phone number" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="country" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Country</FormLabel>
                                        <FormControl><Input {...field} placeholder="Your country" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>

                            {user.accountType === 'company' && (
                                <FormField
                                    control={form.control}
                                    name="vat"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>VAT / KVK Number</FormLabel>
                                            <FormControl><Input {...field} placeholder="e.g., NL123456789B01" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            
                            <div className="flex justify-end">
                                <Button type="submit" disabled={form.formState.isSubmitting || !form.formState.isDirty}>
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
