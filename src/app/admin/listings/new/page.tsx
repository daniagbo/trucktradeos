'use client';
import ListingForm from "@/components/admin/listing-form";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function NewListingPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push('/login?redirect=/admin/listings/new');
        }
    }, [user, loading, router]);

    if (loading || !user || user.role !== 'admin') {
        return (
            <div className="container py-8">
                 <div className="max-w-4xl mx-auto">
                    <Skeleton className="h-10 w-1/3 mb-8" />
                    <div className="space-y-8">
                        <Skeleton className="h-64 w-full" />
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="container py-8">
            <div className="max-w-4xl mx-auto">
                <div>
                    <h1 className="font-headline text-3xl font-bold tracking-tight">Create New Listing</h1>
                    <p className="text-muted-foreground">Fill in the details for the new inventory item.</p>
                </div>
                <div className="mt-8">
                    <ListingForm />
                </div>
            </div>
        </div>
    );
}
