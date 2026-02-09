import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Listing } from '@/lib/types';
import { X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import SaveSearchButton from './save-search-button';
import SavedSearchesDrawer from './saved-searches-drawer';

type Filters = {
  search: string;
  category: string[];
  brand: string[];
  yearMin: number | null;
  yearMax: number | null;
  country: string[];
  condition: string[];
  // Bulk Filters
  type: string[];
  quantityMin: number | null;
  isExportReady: boolean;
  verificationStatus: string[];
  availabilityStatus: string[];
};

interface FilterSidebarProps {
  listings: Listing[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  mobile?: boolean;
  onClose?: () => void;
}

const FilterSection: React.FC<{ title: string, children: React.ReactNode, defaultOpen?: boolean }> = ({ title, children, defaultOpen = true }) => (
  <AccordionItem value={title} className="border-b border-dashed">
    <AccordionTrigger className="font-semibold text-sm hover:no-underline py-4">{title}</AccordionTrigger>
    <AccordionContent className="pb-4 pt-0 text-muted-foreground">{children}</AccordionContent>
  </AccordionItem>
);

export default function FilterSidebar({ listings, filters, setFilters, mobile, onClose }: FilterSidebarProps) {
  const [brandSearch, setBrandSearch] = useState('');

  // Derived Options
  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const brands = new Set<string>();
    const countries = new Set<string>();
    const conditions = new Set<string>();
    let minYear = 2000;
    let maxYear = new Date().getFullYear();

    listings.forEach(listing => {
      categories.add(listing.category);
      brands.add(listing.brand);
      countries.add(listing.country);
      conditions.add(listing.condition);
      if (listing.year) {
        minYear = Math.min(minYear, listing.year);
        maxYear = Math.max(maxYear, listing.year);
      }
    });
    return {
      categories: Array.from(categories).sort(),
      brands: Array.from(brands).sort(),
      countries: Array.from(countries).sort(),
      conditions: Array.from(conditions).sort(),
      minYear,
      maxYear
    };
  }, [listings]);

  // Handlers
  const handleFilterChange = (filterType: keyof Filters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev };

      if (Array.isArray(newFilters[filterType])) {
        const list = newFilters[filterType] as string[];
        const index = list.indexOf(value);
        if (index > -1) {
          list.splice(index, 1);
        } else {
          list.push(value);
        }
      } else {
        (newFilters[filterType] as any) = value;
      }

      return newFilters;
    });
  };

  const handleYearChange = (vals: number[]) => {
    setFilters((prev) => ({
      ...prev,
      yearMin: vals[0],
      yearMax: vals[1]
    }));
  };

  const filteredBrands = filterOptions.brands.filter(b => b.toLowerCase().includes(brandSearch.toLowerCase()));

  return (
    <div className={cn("flex flex-col h-full", mobile ? "" : "pr-4")}>
      {/* Header for Mobile */}
      {mobile && (
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-headline font-bold text-lg">Filters</h2>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="w-5 h-5" /></Button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-1 space-y-6">

        {/* Deal Type - New Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Deal Type</h3>
          <div className="flex gap-2 p-1 bg-secondary/50 rounded-lg border">
            {['single', 'lot'].map(type => (
              <button
                key={type}
                onClick={() => handleFilterChange('type', type)}
                className={cn(
                  "flex-1 px-3 py-2 text-xs font-medium rounded-md transition-all capitalize",
                  filters.type.includes(type)
                    ? "bg-background text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {type === 'single' ? 'Single Unit' : 'Bulk / Lot'}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity Slider */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Min Quantity</h3>
            <span className="text-xs font-medium bg-secondary px-2 py-0.5 rounded text-muted-foreground">{filters.quantityMin || 1}+</span>
          </div>
          <Slider
            defaultValue={[1]}
            value={[filters.quantityMin || 1]}
            min={1}
            max={50}
            step={1}
            onValueChange={(vals) => handleFilterChange('quantityMin', vals[0])}
            className="py-2"
          />
        </div>

        {/* Export Ready */}
        <div className="flex items-center justify-between border-b border-dashed pb-4">
          <label htmlFor="export-ready" className="text-sm font-semibold text-foreground cursor-pointer">Export Ready</label>
          <Checkbox
            id="export-ready"
            checked={filters.isExportReady}
            onCheckedChange={(checked) => handleFilterChange('isExportReady', checked === true)}
          />
        </div>

        {/* Verification */}
        <div className="space-y-2 border-b border-dashed pb-4">
          <h3 className="text-sm font-semibold text-foreground">Verification</h3>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="filter-verification-verified"
              checked={filters.verificationStatus.includes('verified')}
              onCheckedChange={() => handleFilterChange('verificationStatus', 'verified')}
            />
            <label htmlFor="filter-verification-verified" className="cursor-pointer text-sm font-medium leading-none">
              Verified only
            </label>
          </div>
        </div>

        {/* Category Segmented Control */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Category</h3>
          <div className="flex flex-wrap gap-2">
            {filterOptions.categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleFilterChange('category', cat)}
                className={cn(
                  "px-3 py-2 text-xs font-medium rounded-full border transition-all",
                  filters.category.includes(cat)
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <Accordion type="multiple" defaultValue={['Brand', 'Price Range', 'Condition']} className="w-full">
          {/* Brand Searchable */}
          <FilterSection title="Brand">
            <div className="relative mb-3">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search brands..."
                className="pl-8 h-9 text-xs"
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pl-1">
              {filteredBrands.map(item => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-${item}`}
                    checked={filters.brand.includes(item)}
                    onCheckedChange={() => handleFilterChange('brand', item)}
                  />
                  <label htmlFor={`filter-${item}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Year Slider */}
          <FilterSection title="Year Range">
            <div className="px-2 py-4">
              <Slider
                defaultValue={[filterOptions.minYear, filterOptions.maxYear]}
                value={[filters.yearMin || filterOptions.minYear, filters.yearMax || filterOptions.maxYear]}
                min={filterOptions.minYear}
                max={filterOptions.maxYear}
                step={1}
                minStepsBetweenThumbs={1}
                onValueChange={handleYearChange}
                className="my-4"
              />
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{filters.yearMin || filterOptions.minYear}</span>
                <span>{filters.yearMax || filterOptions.maxYear}</span>
              </div>
            </div>
          </FilterSection>

          {/* Condition Chips */}
          <FilterSection title="Condition">
            <div className="flex flex-wrap gap-2">
              {filterOptions.conditions.map(cond => (
                <div
                  key={cond}
                  onClick={() => handleFilterChange('condition', cond)}
                  className={cn(
                    "cursor-pointer px-3 py-2 rounded-md text-xs font-medium border transition-colors",
                    filters.condition.includes(cond)
                      ? "bg-primary/10 border-primary text-primary"
                      : "bg-secondary/50 border-transparent text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {cond}
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Country */}
          <FilterSection title="Country">
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pl-1">
              {filterOptions.countries.map(item => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-country-${item}`}
                    checked={filters.country.includes(item)}
                    onCheckedChange={() => handleFilterChange('country', item)}
                  />
                  <label htmlFor={`filter-country-${item}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1 cursor-pointer">
                    {item}
                  </label>
                </div>
              ))}
            </div>
          </FilterSection>

          {/* Availability Status */}
          <FilterSection title="Availability">
            <div className="space-y-2">
              {['available', 'expected', 'reserved', 'sold'].map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox
                    id={`filter-availability-${status}`}
                    checked={filters.availabilityStatus.includes(status)}
                    onCheckedChange={() => handleFilterChange('availabilityStatus', status)}
                  />
                  <label htmlFor={`filter-availability-${status}`} className="text-sm font-medium leading-none capitalize cursor-pointer">
                    {status}
                  </label>
                </div>
              ))}
            </div>
          </FilterSection>
        </Accordion>

        {/* Saved Searches */}
        {!mobile && (
          <div className="space-y-2 pt-4 border-t border-dashed">
            <SaveSearchButton currentFilters={filters} />
            <SavedSearchesDrawer onApplySearch={(newFilters) => setFilters(newFilters as any)} />
          </div>
        )}
      </div>

      {/* Mobile Footer */}
      {mobile && (
        <div className="p-4 border-t bg-background mt-auto grid grid-cols-2 gap-3 shrink-0 saf-bottom">
          <Button variant="outline" onClick={() => setFilters({
            search: '', category: [], brand: [], yearMin: null, yearMax: null, country: [], condition: [],
            type: [], quantityMin: null, isExportReady: false, verificationStatus: [], availabilityStatus: []
          })}>Reset</Button>
          <Button onClick={onClose}>Show Results</Button>
        </div>
      )}
    </div>
  );
}
