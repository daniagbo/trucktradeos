'use client';
import ListingForm from "@/components/admin/listing-form";
import { useAuth } from "@/hooks/use-auth";
import { useListings } from "@/hooks/use-listings";
import { useRouter } from "next/navigation";
import { useEffect, use } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditListingPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const { user, loading: authLoading } = useAuth();
    const { getListing, loading: listingsLoading } = useListings();
    const router = useRouter();

    const listing = getListing(params.id);
    const loading = authLoading || listingsLoading;

    useEffect(() => {
        if (!loading && (!user || user.role !== 'admin')) {
            router.push(`/login?redirect=/admin/listings/${params.id}/edit`);
        }
        if (!loading && !listing) {
            router.push('/admin/listings');
        }
    }, [user, loading, router, listing, params.id]);

    if (loading || !user || user.role !== 'admin' || !listing) {
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
                    <h1 className="font-headline text-3xl font-bold tracking-tight">Edit Listing</h1>
                    <p className="text-muted-foreground">Update the details for: {listing.title}</p>
                </div>
                <div className="mt-8">
                    <ListingForm existingListing={listing} />
                </div>
            </div>
        </div>
    );
}
