'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRfqs } from "@/hooks/use-rfqs";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

export default function RfqConfirmationPage() {
    const params = useParams();
    const rfqId = params.id as string;
    const { getRfqById, loading } = useRfqs();

    const rfq = getRfqById(rfqId);

    const addonPrices: Record<string, number> = {
        Verification: 350,
        Logistics: 500,
        Financing: 300,
        Compliance: 450,
        DedicatedManager: 1200,
    };
    const packageBase: Record<string, number> = {
        Core: 0,
        Concierge: 900,
        Command: 2400,
    };
    const tierMultiplier: Record<string, number> = {
        Standard: 1,
        Priority: 1.35,
        Enterprise: 1.9,
    };
    const selectedAddons = rfq?.packageAddons || [];
    const monthlyEstimate =
        Math.round((packageBase[rfq?.servicePackage || 'Core'] || 0) * (tierMultiplier[rfq?.serviceTier || 'Standard'] || 1)) +
        selectedAddons.reduce((sum, addon) => sum + (addonPrices[addon] || 0), 0);

    if (loading) {
        return (
             <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
                <Skeleton className="h-64 w-full max-w-lg" />
             </div>
        );
    }
    
    return (
        <div className="container flex min-h-[calc(100vh-8rem)] items-center justify-center py-12">
            <Card className="w-full max-w-lg text-center">
                <CardHeader>
                    <div className="mx-auto bg-green-100 rounded-full p-3 w-fit text-green-600">
                        <CheckCircle2 className="h-10 w-10" />
                    </div>
                    <CardTitle className="mt-4 font-headline text-2xl">Request Received!</CardTitle>
                    <CardDescription>Thank you for your submission. Our team is on it.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                        Your request ID is <span className="font-mono text-foreground">{rfq?.id}</span>.
                        We are reviewing your requirements and will get back to you shortly. You can track the status of your request in your dashboard.
                    </p>
                    <div className="rounded-xl border border-border bg-muted/30 p-3 text-left text-sm">
                        <p><strong>Service lane:</strong> {rfq?.serviceTier || 'Standard'}</p>
                        <p><strong>Package:</strong> {rfq?.servicePackage || 'Core'}</p>
                        <p><strong>Add-ons:</strong> {selectedAddons.length > 0 ? selectedAddons.join(', ') : 'None'}</p>
                        <p><strong>Estimated managed spend:</strong> ${monthlyEstimate.toLocaleString()}/month</p>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <Button asChild>
                            <Link href="/dashboard/rfqs">Track My RFQs</Link>
                        </Button>
                        <Button asChild variant="outline">
                            <Link href="/listings">Browse More Listings</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
