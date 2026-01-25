'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, FileText, Search, Settings, Star, Truck } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login?redirect=/dashboard');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
        <div className="container py-8">
            <Skeleton className="h-12 w-1/3 mb-8" />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                 <Skeleton className="h-48" />
            </div>
        </div>
    );
  }

  const profileIsIncomplete = !user.phone || !user.country || (user.accountType === 'company' && !user.companyName);

  return (
    <div className="container py-8">
      <h1 className="font-headline text-3xl font-bold tracking-tight mb-8">
        Welcome back, {user.name.split(' ')[0]}
      </h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {profileIsIncomplete && (
            <Card className="bg-primary/10 border-primary/20 md:col-span-2 lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                    <Settings className="h-6 w-6 text-primary" />
                    Complete Your Profile
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">
                    Provide more details to build trust and streamline your experience.
                    </p>
                    <Button asChild>
                        <Link href="/profile">
                            Go to Profile <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              New Sourcing Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Can&apos;t find what you&apos;re looking for? Let our team source it for you.
            </p>
            <Button asChild>
              <Link href="/rfq/new">
                Create RFQ <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              Browse Inventory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Explore the latest trucks, trailers, and heavy equipment.
            </p>
            <Button asChild variant="outline">
              <Link href="/listings">
                Start Browsing <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-6 w-6 text-primary" />
              My Sourcing Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Track the status of your active sourcing requests (RFQs).
            </p>
            <Button asChild variant="outline">
              <Link href="/dashboard/rfqs">
                View My RFQs <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="opacity-50 cursor-not-allowed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-6 w-6" />
              Saved Listings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Keep track of equipment you're interested in. (Coming Soon)
            </p>
            <Button variant="outline" disabled>
              View Saved
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
