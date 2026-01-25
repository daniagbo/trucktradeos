import ListingDetailView from '@/components/listings/listing-detail-view';

export default function ListingDetailPage({ params }: { params: { id: string } }) {
  return (
    <ListingDetailView listingId={params.id} />
  );
}
