import { Suspense } from 'react';
import FleetSourceInventoryPage from '@/components/fleetsource/inventory-page';

export default function ListingsPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-10">
          <div className="h-10 w-48 animate-pulse rounded bg-muted" />
        </div>
      }
    >
      <FleetSourceInventoryPage />
    </Suspense>
  );
}
