'use client';
import Image from 'next/image';
import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, MapPin } from 'lucide-react';

interface ListingCardProps {
  listing: Listing;
  isMember: boolean;
}

export default function ListingCard({ listing, isMember }: ListingCardProps) {
  const keySpecs = listing.specs.slice(0, isMember ? 3 : 2);
  const placeholderImage = listing.media[0] || { url: 'https://picsum.photos/seed/placeholder/600/400', imageHint: 'placeholder' };

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col">
      <Link href={`/listings/${listing.id}`} className="block">
        <div className="relative aspect-[3/2] w-full">
          <Image
            src={placeholderImage.url}
            alt={listing.title}
            fill
            className="object-cover"
            data-ai-hint={placeholderImage.imageHint}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {listing.visibility === 'members' && (
             <Badge variant="default" className="absolute top-2 left-2 bg-accent text-accent-foreground">Member Only</Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <Badge variant="secondary" className="mb-2">{listing.category}</Badge>
            {listing.year && <span className="text-sm font-medium">{listing.year}</span>}
          </div>
          <Link href={`/listings/${listing.id}`} className="block">
            <h3 className="font-headline font-semibold text-lg leading-snug truncate hover:text-primary">
              {listing.title}
            </h3>
          </Link>
          <div className="flex items-center text-muted-foreground text-sm mt-1">
            <MapPin className="h-4 w-4 mr-1.5" />
            <span>{listing.city}, {listing.country}</span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {keySpecs.map(spec => (
              <Badge key={spec.key} variant="outline" className="font-normal">
                {spec.value}
              </Badge>
            ))}
             <Badge variant="outline" className="font-normal bg-secondary/50">{listing.condition}</Badge>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">Starting from</span>
                <span className="text-lg font-bold text-primary">Price on Request</span>
            </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Save listing" className="text-muted-foreground hover:text-primary">
              <Bookmark className="h-5 w-5" />
            </Button>
            <Button asChild size="sm">
              <Link href={`/listings/${listing.id}`}>
                {isMember ? 'Get Offer' : 'View Details'}
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
