import FleetSourceListingDetailPage from '@/components/fleetsource/listing-detail-page';

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <FleetSourceListingDetailPage listingId={id} />
  );
}
