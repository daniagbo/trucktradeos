'use client';
import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { Listing } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

type Filters = {
    search: string;
    category: string[];
    brand: string[];
    yearMin: number | null;
    yearMax: number | null;
    country: string[];
    condition: string[];
};

interface FilterSidebarProps {
  listings: Listing[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

const FilterSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <AccordionItem value={title}>
    <AccordionTrigger className="font-semibold text-base">{title}</AccordionTrigger>
    <AccordionContent>{children}</AccordionContent>
  </AccordionItem>
);

const CheckboxFilter: React.FC<{ items: string[], selected: string[], onSelect: (item: string) => void }> = ({ items, selected, onSelect }) => (
  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
    {items.map(item => (
      <div key={item} className="flex items-center space-x-2">
        <Checkbox
          id={`filter-${item}`}
          checked={selected.includes(item)}
          onCheckedChange={() => onSelect(item)}
        />
        <label htmlFor={`filter-${item}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1">
          {item}
        </label>
      </div>
    ))}
  </div>
);

export default function FilterSidebar({ listings, filters, setFilters }: FilterSidebarProps) {
  const router = useRouter();

  const filterOptions = useMemo(() => {
    const categories = new Set<string>();
    const brands = new Set<string>();
    const countries = new Set<string>();
    const conditions = new Set<string>();

    listings.forEach(listing => {
      categories.add(listing.category);
      brands.add(listing.brand);
      countries.add(listing.country);
      conditions.add(listing.condition);
    });
    return {
      categories: Array.from(categories).sort(),
      brands: Array.from(brands).sort(),
      countries: Array.from(countries).sort(),
      conditions: Array.from(conditions).sort(),
    };
  }, [listings]);

  const handleFilterChange = (filterType: keyof Filters, value: any) => {
    setFilters(prev => {
        const newFilters = { ...prev };
        if (Array.isArray(newFilters[filterType])) {
            const list = newFilters[filterType] as string[];
            const index = list.indexOf(value);
            if (index > -1) {
                (newFilters[filterType] as string[]).splice(index, 1);
            } else {
                (newFilters[filterType] as string[]).push(value);
            }
        } else {
            newFilters[filterType] = value;
        }
        
        // Update URL
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, val]) => {
            if (Array.isArray(val)) {
                val.forEach(v => params.append(key, v));
            } else if (val) {
                params.set(key, String(val));
            }
        });
        router.replace(`/listings?${params.toString()}`, { scroll: false });
        
        return newFilters;
    });
  };
  
  const handleClearFilters = () => {
    setFilters({ search: '', category: [], brand: [], yearMin: null, yearMax: null, country: [], condition: []});
    router.replace('/listings', { scroll: false });
  };
  
  const hasActiveFilters = Object.values(filters).some(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== '' && value !== null;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-headline text-xl font-bold">Filters</h2>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-muted-foreground">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      <Input
        placeholder="Search..."
        value={filters.search}
        onChange={(e) => handleFilterChange('search', e.target.value)}
      />
      
      <Accordion type="multiple" defaultValue={['Category', 'Brand', 'Condition']} className="w-full">
        <FilterSection title="Category">
            <CheckboxFilter items={filterOptions.categories} selected={filters.category} onSelect={(item) => handleFilterChange('category', item)} />
        </FilterSection>
        <FilterSection title="Brand">
            <CheckboxFilter items={filterOptions.brands} selected={filters.brand} onSelect={(item) => handleFilterChange('brand', item)} />
        </FilterSection>
        <FilterSection title="Condition">
            <CheckboxFilter items={filterOptions.conditions} selected={filters.condition} onSelect={(item) => handleFilterChange('condition', item)} />
        </FilterSection>
        <FilterSection title="Year">
            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    placeholder="Min"
                    value={filters.yearMin || ''}
                    onChange={(e) => handleFilterChange('yearMin', e.target.value ? Number(e.target.value) : null)}
                />
                <span>-</span>
                <Input
                    type="number"
                    placeholder="Max"
                    value={filters.yearMax || ''}
                    onChange={(e) => handleFilterChange('yearMax', e.target.value ? Number(e.target.value) : null)}
                />
            </div>
        </FilterSection>
        <FilterSection title="Country">
            <CheckboxFilter items={filterOptions.countries} selected={filters.country} onSelect={(item) => handleFilterChange('country', item)} />
        </FilterSection>
      </Accordion>
    </div>
  );
}
