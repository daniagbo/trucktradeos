'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Search, Truck, ShieldCheck } from 'lucide-react';
import ListingCard from '@/components/listings/listing-card';
import { useListings } from '@/hooks/use-listings';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Home() {
  const { listings } = useListings();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  const featuredListings = listings.filter(l => l.visibility === 'public').slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) {
      params.set('search', searchQuery);
    }
    if (category !== 'all') {
      params.set('category', category);
    }
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-card py-20 md:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-primary md:text-6xl">
            The Premier B2B Equipment Marketplace
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground md:text-xl">
            Find, finance, and procure heavy equipment from a network of trusted sellers.
          </p>
          <form onSubmit={handleSearch} className="mt-8 mx-auto max-w-2xl">
            <Card className="shadow-lg">
              <CardContent className="p-4 flex flex-col md:flex-row items-center gap-2">
                <div className="flex-grow w-full grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div className="relative md:col-span-2">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search by keyword, brand, or model..."
                      className="pl-10 h-12 text-base"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Trailer">Trailer</SelectItem>
                      <SelectItem value="Truck">Truck</SelectItem>
                      <SelectItem value="Heavy Equipment">Heavy Equipment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" size="lg" className="w-full md:w-auto h-12 text-base">
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Button>
              </CardContent>
            </Card>
          </form>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="font-headline text-3xl font-bold text-center">Featured Inventory</h2>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} isMember={false} />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="outline" size="lg" onClick={() => router.push('/listings')}>
              Browse All Listings <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>
      
      {/* Trust Section */}
      <section className="bg-card py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-headline text-xl font-semibold">Verified Sellers</h3>
              <p className="mt-2 text-muted-foreground">
                Every listing comes from a vetted and trusted partner. (Verification coming soon)
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                <Truck className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-headline text-xl font-semibold">Global Fleet</h3>
              <p className="mt-2 text-muted-foreground">
                Access a worldwide inventory of trucks, trailers, and heavy equipment.
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary">
                <Search className="h-8 w-8" />
              </div>
              <h3 className="mt-4 font-headline text-xl font-semibold">Transparent Process</h3>
              <p className="mt-2 text-muted-foreground">
                Full specifications and documentation available to members for confident purchasing.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
