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
                    <h1 className="text-3xl font-extrabold tracking-tight">Create new listing</h1>
                    <p className="mt-2 text-sm text-slate-200 md:text-base">Fill in inventory details and publish visibility settings.</p>
                </div>
                <div>
                    <ListingForm />
                </div>
            </div>
        </div>
    );
}
