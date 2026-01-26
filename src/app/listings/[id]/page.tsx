import ListingDetailView from '@/components/listings/listing-detail-view';

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <ListingDetailView listingId={id} />
  );
}
