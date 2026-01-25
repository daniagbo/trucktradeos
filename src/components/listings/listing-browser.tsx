'use client';

import { useState, useEffect, useMemo } from 'react';
import { useListings } from '@/hooks/use-listings';
import { useAuth } from '@/hooks/use-auth';
import type { Listing } from '@/lib/types';
import ListingCard from './listing-card';
import FilterSidebar from './filter-sidebar';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Filter, SearchX } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

type Filters = {
  search: string;
  category: string[];
  brand: string[];
  yearMin: number | null;
  yearMax: number | null;
  country: string[];
  condition: string[];
};

export default function ListingBrowser({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const { listings, loading: listingsLoading } = useListings();
  const { user, loading: authLoading } = useAuth();
  const isMember = !!user;

  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: [],
    brand: [],
    yearMin: null,
    yearMax: null,
    country: [],
    condition: [],
  });
  
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    setFilters({
      search: (searchParams.search as string) || '',
      category: searchParams.category ? (Array.isArray(searchParams.category) ? searchParams.category : [searchParams.category]) : [],
      brand: searchParams.brand ? (Array.isArray(searchParams.brand) ? searchParams.brand : [searchParams.brand]) : [],
      yearMin: searchParams.yearMin ? Number(searchParams.yearMin) : null,
      yearMax: searchParams.yearMax ? Number(searchParams.yearMax) : null,
      country: searchParams.country ? (Array.isArray(searchParams.country) ? searchParams.country : [searchParams.country]) : [],
      condition: searchParams.condition ? (Array.isArray(searchParams.condition) ? searchParams.condition : [searchParams.condition]) : [],
    });
  }, [searchParams]);

  const filteredListings = useMemo(() => {
    let visibleListings = listings.filter(l => l.visibility === 'public' || (isMember && l.visibility === 'members'));
    
    return visibleListings.filter((listing) => {
      const searchLower = filters.search.toLowerCase();
      const titleMatch = listing.title.toLowerCase().includes(searchLower);
      const brandMatch = listing.brand.toLowerCase().includes(searchLower);
      const modelMatch = listing.model?.toLowerCase().includes(searchLower) || false;

      if (filters.search && !(titleMatch || brandMatch || modelMatch)) return false;
      if (filters.category.length > 0 && !filters.category.includes(listing.category)) return false;
      if (filters.brand.length > 0 && !filters.brand.includes(listing.brand)) return false;
      if (filters.yearMin && listing.year && listing.year < filters.yearMin) return false;
      if (filters.yearMax && listing.year && listing.year > filters.yearMax) return false;
      if (filters.country.length > 0 && !filters.country.includes(listing.country)) return false;
      if (filters.condition.length > 0 && !filters.condition.includes(listing.condition)) return false;
      
      return true;
    });
  }, [listings, filters, isMember]);
  
  const handleClearFilters = () => {
    setFilters({
        search: '', category: [], brand: [], yearMin: null, yearMax: null, country: [], condition: []
    });
  };

  const loading = listingsLoading || authLoading;

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight">Browse Listings</h1>
          <p className="text-muted-foreground">{loading ? 'Loading...' : `${filteredListings.length} results found`}</p>
        </div>
        <div className="md:hidden">
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Filter className="h-4 w-4" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <FilterSidebar listings={listings} filters={filters} setFilters={setFilters} />
                </SheetContent>
            </Sheet>
        </div>
      </div>
      <div className="flex gap-8">
        <aside className="hidden md:block w-1/4 lg:w-1/5">
          <div className="sticky top-20">
            <FilterSidebar listings={listings} filters={filters} setFilters={setFilters} />
          </div>
        </aside>
        <main className="w-full md:w-3/4 lg:w-4/5">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-96 w-full" />
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing: Listing) => (
                <ListingCard key={listing.id} listing={listing} isMember={isMember} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed rounded-lg">
                <div className="bg-secondary p-4 rounded-full mb-4">
                    <SearchX className="h-12 w-12 text-muted-foreground" />
                </div>
                <h2 className="font-headline text-2xl font-semibold">No Listings Found</h2>
                <p className="mt-2 text-muted-foreground max-w-sm">
                    Your search and filter combination did not match any listings. Try adjusting your criteria.
                </p>
                <Button onClick={handleClearFilters} variant="outline" className="mt-6">
                    Clear All Filters
                </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
