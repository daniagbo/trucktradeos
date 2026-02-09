'use client';

import ListingDetailView from '@/components/listings/listing-detail-view';

export default function FleetSourceListingDetailPage({ listingId }: { listingId: string }) {
  return <ListingDetailView listingId={listingId} />;
}
