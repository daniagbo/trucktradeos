'use client';
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import RfqWizard from "@/components/rfq/rfq-wizard";
import { useListings } from "@/hooks/use-listings";

export default function NewRfqPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const listingId = searchParams.get('listingId');
    const { getListing, loading: listingsLoading } = useListings();
    
    const listing = listingId ? getListing(listingId) : undefined;
    const loading = authLoading || (listingId && listingsLoading);

    useEffect(() => {
        if (!loading && !user) {
            const redirectUrl = listingId ? `/rfq/new?listingId=${listingId}` : '/rfq/new';
            router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
        }
    }, [user, loading, router, listingId]);

    if (loading || !user) {
        return (
            <div className="container py-12">
                <div className="max-w-3xl mx-auto">
                    <Skeleton className="h-24 w-full mb-4" />
                    <Skeleton className="h-96 w-full" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="container py-12">
            <RfqWizard listing={listing} />
        </div>
    );
}
