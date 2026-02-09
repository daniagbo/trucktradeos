'use client';
import ListingForm from "@/components/admin/listing-form";
import AdminAuditTimeline from "@/components/admin/audit-timeline";
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
            <div className="container mx-auto px-4 py-10">
                <div className="mx-auto max-w-4xl">
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
        <div className="container mx-auto px-4 py-10">
            <div className="mx-auto max-w-4xl">
                <div className="mb-6 rounded-3xl border border-border bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 p-7 text-white md:p-9">
                    <h1 className="text-3xl font-extrabold tracking-tight">Edit listing</h1>
                    <p className="mt-2 text-sm text-slate-200 md:text-base">Update the details for: {listing.title}</p>
                </div>
                <div>
                    <ListingForm existingListing={listing} />
                </div>
                <div className="mt-8">
                    <AdminAuditTimeline entityId={listing.id} scope="listing" />
                </div>
            </div>
        </div>
    );
}
