'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Listing, ListingMedia, Spec } from '@/lib/types';
import { useListings } from '@/hooks/use-listings';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Sparkles, Trash2, X } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { enhanceWithAI } from '@/lib/actions';
import { useState } from 'react';

const specSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
});

const mediaSchema = z.object({
  id: z.string(),
  url: z.string(),
  imageHint: z.string(),
  sortOrder: z.number(),
});

const formSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  category: z.enum(['Trailer', 'Truck', 'Heavy Equipment']),
  brand: z.string().min(2, 'Brand is required'),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  condition: z.enum(['Excellent', 'Good', 'Used', 'As-is']),
  country: z.string().min(2, 'Country is required'),
  city: z.string().optional(),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  specs: z.array(specSchema),
  visibility: z.enum(['public', 'members', 'hidden']),
  media: z.array(mediaSchema).min(1, "At least one image is required."),
  extraNotes: z.string().optional(),
});

type ListingFormValues = z.infer<typeof formSchema>;

interface ListingFormProps {
  existingListing?: Listing;
}

function EnhanceButton({ getValues, setValue }: { getValues: any, setValue: any }) {
  const [pending, setPending] = useState(false);
  const { toast } = useToast();

  const handleEnhance = async () => {
    setPending(true);
    const category = getValues('category');
    const specs = getValues('specs');
    const existingDescription = getValues('description');
    
    const specsObject = specs.reduce((acc: Record<string,string>, spec: Spec) => {
        if(spec.key && spec.value) acc[spec.key] = spec.value;
        return acc;
    }, {});
    
    const formData = new FormData();
    formData.append('category', category);
    formData.append('specs', JSON.stringify(specsObject));
    formData.append('existingDescription', existingDescription);

    const result = await enhanceWithAI(null, formData);
    
    if (result.enhancedDescription) {
        setValue('description', result.enhancedDescription, { shouldDirty: true });
        toast({ title: "Description Enhanced", description: "The AI has generated a new description." });
    } else {
        toast({ variant: 'destructive', title: "Enhancement Failed", description: result.message });
    }
    setPending(false);
  };
  
  return (
    <Button type="button" variant="outline" size="sm" onClick={handleEnhance} disabled={pending}>
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
        Enhance with AI
    </Button>
  );
}


export default function ListingForm({ existingListing }: ListingFormProps) {
  const router = useRouter();
  const { addListing, updateListing } = useListings();
  const { toast } = useToast();

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: existingListing ? {
      ...existingListing,
      year: existingListing.year || undefined,
    } : {
      title: '',
      category: 'Truck',
      brand: '',
      model: '',
      year: undefined,
      condition: 'Used',
      country: '',
      city: '',
      description: '',
      visibility: 'public',
      specs: [{ key: '', value: '' }],
      media: [],
      extraNotes: '',
    },
  });

  const { fields: specFields, append: appendSpec, remove: removeSpec } = useFieldArray({
    control: form.control,
    name: 'specs',
  });
  
  const { fields: mediaFields, append: appendMedia, remove: removeMedia } = useFieldArray({
    control: form.control,
    name: 'media',
  });

  async function onSubmit(data: ListingFormValues) {
    if (existingListing) {
      updateListing(existingListing.id, data);
      toast({ title: 'Success', description: 'Listing updated successfully.' });
    } else {
      addListing(data);
      toast({ title: 'Success', description: 'Listing created successfully.' });
    }
    router.push('/admin/listings');
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Category</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Truck">Truck</SelectItem><SelectItem value="Trailer">Trailer</SelectItem><SelectItem value="Heavy Equipment">Heavy Equipment</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem><FormLabel>Brand</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="model" render={({ field }) => (
                <FormItem><FormLabel>Model</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="year" render={({ field }) => (
                <FormItem><FormLabel>Year</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Details & Description</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField control={form.control} name="condition" render={({ field }) => (
                <FormItem><FormLabel>Condition</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="Excellent">Excellent</SelectItem><SelectItem value="Good">Good</SelectItem><SelectItem value="Used">Used</SelectItem><SelectItem value="As-is">As-is</SelectItem></SelectContent></Select><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="country" render={({ field }) => (
                <FormItem><FormLabel>Country</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="city" render={({ field }) => (
                <FormItem><FormLabel>City</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><div className="flex justify-between items-center"><FormLabel>Description</FormLabel><EnhanceButton getValues={form.getValues} setValue={form.setValue} /></div><FormControl><Textarea rows={5} {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="extraNotes" render={({ field }) => (
                <FormItem><FormLabel>Extra Notes (for members)</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
              )} />
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader><CardTitle>Specifications</CardTitle></CardHeader>
            <CardContent>
                {specFields.map((field, index) => (
                    <div key={field.id} className="flex gap-2 items-end mb-2">
                        <FormField control={form.control} name={`specs.${index}.key`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className={index !== 0 ? 'sr-only' : ''}>Key</FormLabel><FormControl><Input placeholder="e.g. Mileage" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`specs.${index}.value`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className={index !== 0 ? 'sr-only' : ''}>Value</FormLabel><FormControl><Input placeholder="e.g. 50,000 km" {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeSpec(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                ))}
                <Button type="button" size="sm" variant="outline" onClick={() => appendSpec({ key: '', value: '' })}><PlusCircle className="mr-2 h-4 w-4" />Add Spec</Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Media</CardTitle></CardHeader>
            <CardContent>
                <FormField name="media" control={form.control} render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={(val) => {
                       const image = PlaceHolderImages.find(p => p.imageUrl === val);
                       if (image && !mediaFields.some(f => f.url === val)) {
                          appendMedia({ id: image.id, url: image.imageUrl, imageHint: image.imageHint, sortOrder: mediaFields.length + 1 });
                       }
                    }}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select an image to add..." /></SelectTrigger></FormControl>
                        <SelectContent>
                            {PlaceHolderImages.map(img => (
                                <SelectItem key={img.id} value={img.imageUrl} disabled={mediaFields.some(f => f.url === img.imageUrl)}>
                                    {img.description}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                    {mediaFields.map((field, index) => (
                        <div key={field.id} className="relative aspect-square">
                            <img src={field.url} alt="listing media" className="rounded-md object-cover w-full h-full" />
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => removeMedia(index)}><X className="h-4 w-4" /></Button>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Visibility</CardTitle></CardHeader>
          <CardContent>
            <FormField control={form.control} name="visibility" render={({ field }) => (
              <FormItem><FormLabel>Listing Visibility</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent><SelectItem value="public">Public</SelectItem><SelectItem value="members">Members Only</SelectItem><SelectItem value="hidden">Hidden</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {existingListing ? 'Save Changes' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
