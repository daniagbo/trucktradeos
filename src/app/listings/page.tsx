import ListingBrowser from '@/components/listings/listing-browser';

export default function ListingsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  return (
    <div>
      <ListingBrowser searchParams={searchParams} />
    </div>
  );
}
