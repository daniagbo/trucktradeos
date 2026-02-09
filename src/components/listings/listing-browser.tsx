'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useListings } from '@/hooks/use-listings';
import { useAuth } from '@/hooks/use-auth';
import type { Listing } from '@/lib/types';
import ListingCard from './listing-card';
import FilterSidebar from './filter-sidebar';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, SearchX, LayoutGrid, List, X, ShieldCheck, Globe, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

type Filters = {
  search: string;
  category: string[];
  brand: string[];
  yearMin: number | null;
  yearMax: number | null;
  country: string[];
  condition: string[];
  // Bulk Filters
  type: string[]; // 'single' | 'lot'
  quantityMin: number | null;
  isExportReady: boolean;
  verificationStatus: string[];
  availabilityStatus: string[];
};

export default function ListingBrowser() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { listings, loading: listingsLoading } = useListings();
  const { user, loading: authLoading } = useAuth();
  const isMember = !!user;

  // View & Sort State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');

  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: [],
    brand: [],
    yearMin: null,
    yearMax: null,
    country: [],
    condition: [],
    type: [],
    quantityMin: null,
    isExportReady: false,
    verificationStatus: [],
    availabilityStatus: [],
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      category: searchParams.getAll('category'),
      brand: searchParams.getAll('brand'),
      yearMin: searchParams.get('yearMin') ? Number(searchParams.get('yearMin')) : null,
      yearMax: searchParams.get('yearMax') ? Number(searchParams.get('yearMax')) : null,
      country: searchParams.getAll('country'),
      condition: searchParams.getAll('condition'),
      type: searchParams.getAll('type'),
      quantityMin: searchParams.get('quantityMin') ? Number(searchParams.get('quantityMin')) : null,
      isExportReady: searchParams.get('isExportReady') === 'true',
      verificationStatus: searchParams.getAll('verificationStatus'),
      availabilityStatus: searchParams.getAll('availabilityStatus'),
    });
  }, [searchParams]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry) params.append(key, String(entry));
        });
      } else if (value !== null && value !== '' && value !== false) {
        params.set(key, String(value));
      }
    });
    const nextQuery = params.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `/listings?${nextQuery}` : '/listings', { scroll: false });
    }
  }, [filters, router, searchParams]);

  // Combined Filter & Sort Logic
  const filteredListings = useMemo(() => {
    let result = listings.filter(l => l.visibility === 'public' || (isMember && l.visibility === 'members'));

    // 0. Default hide sold unless explicit filter
    if (filters.availabilityStatus.length === 0) {
      result = result.filter(l => l.availabilityStatus !== 'sold');
    }

    // 1. Filter
    result = result.filter((listing) => {
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

      // Bulk Filters
      if (filters.type.length > 0 && !filters.type.includes(listing.type)) return false;
      if (filters.quantityMin && listing.quantity < filters.quantityMin) return false;
      if (filters.isExportReady && !listing.isExportReady) return false;
      if (
        filters.verificationStatus.length > 0 &&
        !filters.verificationStatus.includes((listing.verificationStatus || '').toLowerCase())
      ) return false;
      if (filters.availabilityStatus.length > 0 && !filters.availabilityStatus.includes(listing.availabilityStatus)) return false;

      return true;
    });

    // 2. Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'year-desc': return (b.year || 0) - (a.year || 0);
        case 'year-asc': return (a.year || 0) - (b.year || 0);
        case 'newest':
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [listings, filters, isMember, sortBy]);

  const handleClearFilters = () => {
    setFilters({
      search: '', category: [], brand: [], yearMin: null, yearMax: null, country: [], condition: [],
      type: [], quantityMin: null, isExportReady: false, verificationStatus: [], availabilityStatus: []
    });
  };

  const removeFilter = (key: keyof Filters, value: any) => {
    const newFilters = { ...filters };
    if (Array.isArray(newFilters[key])) {
      (newFilters[key] as string[]) = (newFilters[key] as string[]).filter(v => v !== value);
    } else if (key === 'isExportReady') {
      (newFilters[key] as boolean) = false;
    } else {
      (newFilters[key] as any) = key === 'yearMin' || key === 'yearMax' || key === 'quantityMin' ? null : '';
    }
    setFilters(newFilters);
  };

  const loading = listingsLoading || authLoading;

  // Active Filters Helper
  const activeFilters = useMemo(() => {
    const active: { key: string; label: string; value: any }[] = [];
    if (filters.search) active.push({ key: 'search', label: `Search: ${filters.search}`, value: filters.search });
    filters.category.forEach(c => active.push({ key: 'category', label: c, value: c }));
    filters.brand.forEach(b => active.push({ key: 'brand', label: b, value: b }));
    filters.country.forEach(c => active.push({ key: 'country', label: c, value: c }));
    filters.condition.forEach(c => active.push({ key: 'condition', label: c, value: c }));

    // Bulk Filters
    filters.type.forEach(t => active.push({ key: 'type', label: t === 'lot' ? 'Bulk / Lot' : 'Single Unit', value: t }));
    if (filters.quantityMin) active.push({ key: 'quantityMin', label: `Min Qty: ${filters.quantityMin}`, value: filters.quantityMin });
    if (filters.isExportReady) active.push({ key: 'isExportReady', label: 'Export Ready', value: true });
    filters.verificationStatus.forEach(v => active.push({ key: 'verificationStatus', label: v === 'verified' ? 'Verified' : v, value: v }));
    filters.availabilityStatus.forEach(s => active.push({ key: 'availabilityStatus', label: s.charAt(0).toUpperCase() + s.slice(1), value: s }));

    if (filters.yearMin || filters.yearMax) {
      active.push({
        key: 'year', // Special case, handled manually in remove if needed, or split 
        label: `Year: ${filters.yearMin || 'Any'} - ${filters.yearMax || 'Any'}`,
        value: 'year-range'
      });
    }
    return active;
  }, [filters]);

  const toggleQuickFilter = (key: 'verificationStatus' | 'availabilityStatus', value: string) => {
    setFilters((prev) => {
      const current = prev[key];
      const exists = current.includes(value);
      return {
        ...prev,
        [key]: exists ? current.filter((item) => item !== value) : [...current, value],
      };
    });
  };


  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Sticky Header */}
      <div className="sticky top-20 z-30 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="container py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">

          {/* Left: Count & Mobile Trigger */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h1 className="font-headline text-2xl font-bold tracking-tight">Listings</h1>
              <span className="text-sm text-muted-foreground font-medium">{filteredListings.length} results</span>
            </div>

            <div className="md:hidden">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" /> Filters
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full sm:w-[400px] p-0">
                  <div className="h-full overflow-y-auto p-6">
                    <FilterSidebar listings={listings} filters={filters} setFilters={setFilters} mobile onClose={() => setMobileFiltersOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Right: Sort & View Toggle */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sort by:</span>
              <select
                className="bg-transparent text-sm font-medium focus:outline-none cursor-pointer"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest Listed</option>
                <option value="year-desc">Year (Newest)</option>
                <option value="year-asc">Year (Oldest)</option>
              </select>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center bg-secondary/50 p-1 rounded-lg border border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container pt-8 flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-40">
            <FilterSidebar listings={listings} filters={filters} setFilters={setFilters} />
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => toggleQuickFilter('verificationStatus', 'verified')}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${filters.verificationStatus.includes('verified') ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified only
            </button>
            <button
              onClick={() => setFilters((prev) => ({ ...prev, isExportReady: !prev.isExportReady }))}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${filters.isExportReady ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
            >
              <Globe className="h-3.5 w-3.5" />
              Export ready
            </button>
            <button
              onClick={() => toggleQuickFilter('availabilityStatus', 'available')}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${filters.availabilityStatus.includes('available') ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Available now
            </button>
          </div>

          {/* Active Filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {activeFilters.map((f, i) => (
                <Badge key={i} variant="secondary" className="px-2 py-1 gap-1 hover:bg-secondary-foreground/10 transition-colors cursor-pointer" onClick={() => {
                  if (f.key === 'year') {
                    setFilters(prev => ({ ...prev, yearMin: null, yearMax: null }));
                  } else {
                    removeFilter(f.key as keyof Filters, f.value);
                  }
                }}>
                  {f.label} <X className="h-3 w-3" />
                </Badge>
              ))}
              <Button variant="link" size="sm" onClick={handleClearFilters} className="text-muted-foreground h-auto p-0 ml-2">Clear all</Button>
            </div>
          )}

          {loading ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col space-y-3">
                  <Skeleton className="h-[250px] w-full rounded-2xl" />
                  <div className="space-y-2 px-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredListings.length > 0 ? (
            <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
              {filteredListings.map((listing: Listing) => (
                <ListingCard key={listing.id} listing={listing} isMember={isMember} viewMode={viewMode} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-20 border-2 border-dashed border-border rounded-xl bg-card">
              <div className="bg-secondary p-4 rounded-full mb-4">
                <SearchX className="h-10 w-10 text-muted-foreground" />
              </div>
              <h2 className="font-headline text-xl font-semibold">No Listings Found</h2>
              <p className="mt-2 text-muted-foreground max-w-sm text-sm">
                Try adjusting your filters or search terms.
              </p>
              <Button onClick={handleClearFilters} variant="outline" className="mt-6">
                Clear Filters
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
