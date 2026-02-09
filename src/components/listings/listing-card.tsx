import { memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Listing } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ShieldCheck, Gauge, Info, Calendar, Layers, Box, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import AvailabilityBadge from './availability-badge';

interface ListingCardProps {
  listing: Listing;
  isMember: boolean;
  viewMode?: 'grid' | 'list';
}

/**
 * ⚡ Performance: Memoized to prevent unnecessary re-renders in large lists (ListingBrowser)
 * and the homepage when unrelated state changes (e.g. filters, scroll state).
 */
function ListingCard({ listing, isMember, viewMode = 'grid' }: ListingCardProps) {
  // Use first 3 specs for chips
  const keySpecs = listing.specs?.slice(0, 3) || [];
  const placeholderImage = listing.media?.[0] || { url: 'https://picsum.photos/seed/placeholder/800/600', imageHint: 'placeholder' };
  const isLot = listing.type === 'lot';

  // Helper to standardise price display
  const priceDisplay = () => {
    if (!isMember) return 'On Request';
    if (isLot && listing.pricePerUnit) {
      return `From €${listing.pricePerUnit.toLocaleString()} / unit`;
    }
    return 'On Request'; // Placeholder price logic
  }

  // Grid View (Default)
  return (
    <Card className="group fx-lift overflow-hidden hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300 border-border bg-card flex flex-col h-full rounded-2xl">
      <Link href={`/listings/${listing.id}`} className="block relative overflow-hidden aspect-[4/3] w-full bg-secondary">
        <Image
          src={placeholderImage.url}
          alt={listing.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        {/* Badges Overlay */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 items-start">
          {isLot && (
            <Badge className="bg-purple-600/95 backdrop-blur-sm text-white font-bold border-none shadow-sm px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Layers className="h-3 w-3" /> Lot Deal
            </Badge>
          )}
          {listing.verificationStatus === 'Verified' && (
            <Badge className="bg-emerald-500/95 backdrop-blur-sm text-white font-bold border-none shadow-sm px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Verified
            </Badge>
          )}
          {listing.isExportReady && (
            <Badge className="bg-blue-600/95 backdrop-blur-sm text-white border-none shadow-sm px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider flex items-center gap-1">
              <Globe className="h-3 w-3" /> Export Ready
            </Badge>
          )}
          <AvailabilityBadge status={listing.availabilityStatus} />
        </div>

        {/* Bottom Gradient Overlay for Location */}
        <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-between">
          <div className="flex items-center text-xs font-medium text-white/90 drop-shadow-sm">
            <MapPin className="h-3.5 w-3.5 mr-1" />
            {listing.city ? `${listing.city}, ${listing.country}` : listing.country}
          </div>
          {isLot && (
            <div className="flex items-center text-xs font-bold text-white/90 drop-shadow-sm bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10">
              <Box className="h-3.5 w-3.5 mr-1" /> {listing.quantity} Units
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Title Block */}
        <div className="mb-3">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/80">{listing.category}</span>
            <span className="text-xs font-semibold text-muted-foreground">{listing.year}</span>
          </div>
          <Link href={`/listings/${listing.id}`} className="group/title block">
            <h3 className="font-headline font-bold text-lg leading-tight text-foreground group-hover/title:text-primary transition-colors line-clamp-1">
              {listing.brand} {listing.model || 'Equipment'}
            </h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1 h-5">{listing.title}</p>
          </Link>
        </div>

        {/* Specs Row */}
        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[52px] content-start">
          {keySpecs.map(spec => (
            <div key={spec.key} className="text-[10px] font-medium text-foreground/80 bg-secondary/80 px-2 py-1 rounded-[4px] truncate max-w-[45%]">
              {spec.value}
            </div>
          ))}
          {keySpecs.length === 0 && <span className="text-[10px] text-muted-foreground italic">No specifications available</span>}
        </div>

        {/* Footer: Price & CTA */}
        <div className="mt-auto pt-3 border-t border-border/50 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase">{isLot ? 'Starting Price' : 'Price'}</span>
            <span className="font-bold font-headline text-foreground text-sm">
              {priceDisplay()}
            </span>
          </div>
          <Button size="sm" className="h-8 px-4 text-xs ml-2 shadow-sm rounded-lg" asChild>
            <Link href={`/listings/${listing.id}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default memo(ListingCard);
