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
import { FileText, Info, Lock, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ListingDetailView({ listingId }: { listingId: string }) {
  const { getListing, loading: listingsLoading } = useListings();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const listing = getListing(listingId);
  const isMember = !!user;

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

  const GatedContent = ({ children, title, icon: Icon }: {children: React.ReactNode, title: string, icon: React.ElementType}) => (
    <Card className="bg-secondary/50">
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
            <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary">{listing.category}</Badge>
                <Badge variant="outline">{listing.condition}</Badge>
            </div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">{listing.title}</h1>
            <div className="flex items-center text-muted-foreground text-base mt-2">
                <MapPin className="h-5 w-5 mr-2" />
                <span>{listing.city}, {listing.country}</span>
            </div>
          </div>

          <ListingGallery media={listing.media} />

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
                        {listing.specs.map((spec) => (
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
              <p className="text-muted-foreground">All relevant documents are available for verified members. This may include service history, inspection reports, and titles.</p>
              <Button className="mt-4" disabled>Download Documents (Phase 2)</Button>
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
