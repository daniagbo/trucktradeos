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
