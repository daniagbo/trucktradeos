import ListingBrowser from '@/components/listings/listing-browser';
import { Suspense } from 'react';

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-center text-muted-foreground">Loading listings...</div>}>
      <ListingBrowser />
    </Suspense>
  );
}
