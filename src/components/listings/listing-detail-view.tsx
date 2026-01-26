'use client';
import { useEffect } from 'react';
import { useListings } from '@/hooks/use-listings';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import ListingGallery from './listing-gallery';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableRow } from '../ui/table';
import { FileText, Info, Lock, MapPin, ShieldCheck, Download, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { VerificationStatus, Listing } from '@/lib/types';
import { cn } from '@/lib/utils';
import ListingCard from './listing-card';
import { Progress } from '../ui/progress';
import AvailabilityBadge from './availability-badge';
import SlaMessaging from '../ui/sla-messaging';
import TrustedServices from './trusted-services';

const getCompleteness = (listing: Listing) => {
  let score = 0;
  if ((listing.media?.length || 0) > 0) score += 25;
  if ((listing.specs?.length || 0) > 2) score += 25;
  if (listing.verificationStatus === 'Verified') score += 25;
  if ((listing.documents?.length || 0) > 0) score += 25;
  return score;
}

const VerificationBadge = ({ status }: { status: VerificationStatus }) => {
  if (status === 'Verified') {
    return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200"><ShieldCheck className="h-4 w-4 mr-1" />Verified Source</Badge>
  }
  if (status === 'Pending') {
    return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Verification Pending</Badge>
  }
  return <Badge variant="outline">Unverified</Badge>
}

const ListingCompleteness = ({ listing }: { listing: Listing }) => {
  const completeness = getCompleteness(listing);
  const items = [
    { label: 'Photos included', complete: (listing.media?.length || 0) > 0 },
    { label: 'Key specifications listed', complete: (listing.specs?.length || 0) > 2 },
    { label: 'Source is verified', complete: listing.verificationStatus === 'Verified' },
    { label: 'Documents available', complete: (listing.documents?.length || 0) > 0 },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          Listing Completeness
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <Progress value={completeness} className="h-2" />
          <span className="font-bold text-lg">{completeness}%</span>
        </div>
        <ul className="space-y-2">
          {items.map(item => (
            <li key={item.label} className="flex items-center text-sm">
              <CheckCircle className={cn("h-4 w-4 mr-2", item.complete ? "text-green-500" : "text-muted-foreground/50")} />
              <span className={cn(item.complete ? "text-foreground" : "text-muted-foreground")}>{item.label}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

export default function ListingDetailView({ listingId }: { listingId: string }) {
  const { listings, getListing, loading: listingsLoading } = useListings();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const listing = getListing(listingId);
  const isMember = !!user;

  const similarListings = listings
    .filter(l => l.id !== listingId && l.category === listing?.category)
    .slice(0, 3);

  useEffect(() => {
    if (!listingsLoading && !listing) {
      router.push('/listings');
    }
  }, [listingsLoading, listing, router]);

  const loading = listingsLoading || authLoading;

  if (loading || !listing) {
    return (
      <div className="container py-12">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          <div className="md:col-span-2 space-y-8">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-80 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const GatedContent = ({ children, title, icon: Icon }: { children: React.ReactNode, title: string, icon: React.ElementType }) => (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl font-headline">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isMember ? (
          children
        ) : (
          <div className="text-center py-8 px-4 bg-background rounded-lg border border-dashed">
            <Lock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-4 font-semibold">Full access for members only</p>
            <p className="text-muted-foreground mt-1 text-sm">Sign up or log in to view more details and documents.</p>
            <div className="mt-4 flex gap-2 justify-center">
              <Button asChild><Link href={`/register?redirect=/listings/${listing.id}`}>Sign Up</Link></Button>
              <Button asChild variant="outline"><Link href={`/login?redirect=/listings/${listing.id}`}>Log In</Link></Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container py-8 md:py-12">
      <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
        <div className="md:col-span-2 space-y-8">
          <div>
            <div className="flex flex-wrap gap-2 mb-2 items-center">
              <Badge variant="secondary">{listing.category}</Badge>
              <Badge variant="outline">{listing.condition}</Badge>
              <VerificationBadge status={listing.verificationStatus} />
              <AvailabilityBadge status={listing.availabilityStatus} />
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">{listing.title}</h1>
            <div className="flex items-center text-muted-foreground text-base mt-2">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{listing.city}, {listing.country}</span>
            </div>
          </div>

          <ListingGallery media={listing.media} />

          <ListingCompleteness listing={listing} />

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-headline">Description</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-foreground">
              <p>{listing.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-headline">Key Specifications</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableBody>
                  {listing.specs?.map((spec) => (
                    <TableRow key={spec.key}>
                      <TableCell className="font-medium">{spec.key}</TableCell>
                      <TableCell>{spec.value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <GatedContent title="Documents" icon={FileText}>
            <div className="space-y-2">
              {(listing.documents?.length || 0) > 0 ? (
                listing.documents.map(doc => (
                  <a key={doc.id} href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 rounded-md border hover:bg-secondary transition-colors">
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <p className="text-sm text-muted-foreground">{doc.type} - Added {new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Download className="h-5 w-5 text-muted-foreground" />
                  </a>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No documents have been uploaded for this listing yet.</p>
              )}
            </div>
          </GatedContent>

          <GatedContent title="Extra Notes" icon={Info}>
            <p className="text-muted-foreground">{listing.extraNotes || 'No extra notes provided.'}</p>
          </GatedContent>
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-24 space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Brand</span> <span className="font-medium">{listing.brand}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Model</span> <span className="font-medium">{listing.model || 'N/A'}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Year</span> <span className="font-medium">{listing.year || 'N/A'}</span></div>
                <div className="flex justify-between items-center"><span className="text-muted-foreground">Condition</span> <span className="font-medium">{listing.condition}</span></div>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg">
              <CardHeader>
                <CardDescription>Price</CardDescription>
                <CardTitle className="text-3xl text-primary font-headline">Price on Request</CardTitle>
              </CardHeader>
              <CardContent>
                {isMember ? (
                  <Button size="lg" className="w-full" asChild>
                    <Link href={`/rfq/new?listingId=${listing.id}`}>Request Offer</Link>
                  </Button>
                ) : (
                  <Button size="lg" className="w-full" asChild>
                    <Link href={`/register?redirect=/listings/${listing.id}`}>Unlock Full Details</Link>
                  </Button>
                )}
                <p className="text-xs text-muted-foreground mt-2">{isMember ? 'We will get back to you with a quote.' : 'Log in or sign up to get offers.'}</p>
                {isMember && (
                  <div className="mt-4">
                    <SlaMessaging />
                  </div>
                )}
              </CardContent>
            </Card>

            <TrustedServices />
          </div>
        </div>
      </div>

      {/* Similar Listings */}
      {similarListings.length > 0 && (
        <div className="mt-16 border-t pt-10">
          <h2 className="font-headline text-2xl font-bold mb-6">Similar Listings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarListings.map(l => (
              <ListingCard key={l.id} listing={l} isMember={isMember} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
