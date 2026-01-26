'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { X, Filter, ArrowUpDown } from 'lucide-react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import { RFQStatus } from '@/lib/types';

interface RfqsToolbarProps {
    countries: string[];
}

const statuses: RFQStatus[] = ['Received', 'In progress', 'Offer sent', 'Pending execution', 'Won', 'Lost'];
const categories = ['Trailer', 'Truck', 'Heavy Equipment'];
const urgencies = ['Normal', 'Urgent'];

export function RfqsToolbar({ countries }: RfqsToolbarProps) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const [search, setSearch] = useState(searchParams.get('q')?.toString() || '');
    const debouncedSearch = useDebounce(search, 300);

    const createQueryString = useCallback(
        (name: string, value: string | null) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value === null || value === '') {
                params.delete(name);
            } else {
                params.set(name, value);
            }
            return params.toString();
        },
        [searchParams]
    );

    const updateSearch = useCallback((term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set('q', term);
        } else {
            params.delete('q');
        }
        replace(`${pathname}?${params.toString()}`);
    }, [pathname, replace, searchParams]);

    // Handle debounced search separately from direct rendering to avoid typing lag
    useEffect(() => {
        // This effect is tricky with useDebounce and URL sync.
        // If I type, `search` updates. `debouncedSearch` updates later.
        // When `debouncedSearch` updates, I push to URL.
        // If URL changes, `searchParams` changes.
        // I don't want to reset `search` from `searchParams` while typing.

        const currentQ = searchParams.get('q') || '';
        // Ensure we only sync if the debounced value matches the current input (settled)
        // and it is different from the URL. This prevents race conditions when clearing.
        if (debouncedSearch === search && debouncedSearch !== currentQ) {
            updateSearch(debouncedSearch);
        }
    }, [debouncedSearch, search, updateSearch, searchParams]);


    const handleStatusChange = (status: string, checked: boolean) => {
        const param = searchParams.get('status');
        // If param is null (missing), treat as default ['Received', 'In progress']
        const currentStatuses = param === null
            ? ['Received', 'In progress']
            : param.split(',').filter(Boolean);

        let newStatuses: string[];

        if (checked) {
            newStatuses = [...currentStatuses, status];
        } else {
            newStatuses = currentStatuses.filter((s) => s !== status);
        }

        const params = new URLSearchParams(searchParams.toString());
        if (newStatuses.length > 0) {
            params.set('status', newStatuses.join(','));
        } else {
            // If empty, we might want to represent 'None' or 'All'?
            // But if we delete, it goes back to default.
            // To allow 'All', user should select all.
            // To allow 'None' (empty list), we need to send an empty string or special value.
            // Let's assume user won't want 'None'.
            // If they deselect all defaults, they might expect 'All'?
            // No, standard multi-select: nothing selected = nothing shown OR all shown.
            // Given our default logic, nothing selected (delete) = default shown.
            // To show 'All', they select all.
            // To show 'Nothing' (e.g. to clear clutter), they can't.
            // If they want to see "In progress" only, they uncheck "Received".
            params.set('status', newStatuses.join(','));
        }

        // Edge case: If newStatuses matches default exactly, we COULD delete the param to clean URL.
        // But keeping it explicit is safer for now.
        if (newStatuses.length === 0) {
             // If they somehow uncheck everything, and we set `status=` (empty),
             // AdminRfqsClient needs to handle empty string as "None" or "All"?
             // AdminRfqsClient logic: `statusParam` (string). `if (statusParam) ... else Default`.
             // Empty string is falsy. So it falls back to Default!
             // So unchecking everything resets to Default.
             params.delete('status');
        }

        replace(`${pathname}?${params.toString()}`);
    };

    const handleCategoryChange = (category: string, checked: boolean) => {
        const currentCategories = searchParams.get('category')?.split(',').filter(Boolean) || [];
        let newCategories: string[];

        if (checked) {
            newCategories = [...currentCategories, category];
        } else {
            newCategories = currentCategories.filter((c) => c !== category);
        }

        const params = new URLSearchParams(searchParams.toString());
        if (newCategories.length > 0) {
            params.set('category', newCategories.join(','));
        } else {
            params.delete('category');
        }
        replace(`${pathname}?${params.toString()}`);
    };

    const handleUrgencyChange = (val: string) => {
        replace(`${pathname}?${createQueryString('urgency', val === 'all' ? null : val)}`);
    };

    const handleCountryChange = (val: string) => {
        replace(`${pathname}?${createQueryString('country', val === 'all' ? null : val)}`);
    };

    const handleSortChange = (val: string) => {
        replace(`${pathname}?${createQueryString('sort', val)}`);
    };

    const clearAll = () => {
        replace(pathname);
        setSearch('');
    };

    const clearFilter = (key: string, value?: string) => {
         const params = new URLSearchParams(searchParams.toString());

         if (key === 'status' && value) {
             const param = params.get('status');
             // Handle default values if param is missing
             const current = param === null
                ? ['Received', 'In progress']
                : param.split(',').filter(Boolean);

             const newValues = current.filter(v => v !== value);
             if (newValues.length > 0) {
                 params.set(key, newValues.join(','));
             } else {
                 // If removing the last item, we delete the param.
                 // This falls back to default in AdminRfqsClient.
                 // So removing "In progress" (last one) -> Default (Received + In progress).
                 // This means you can't clear all!
                 // To clear all (empty), we need to set empty string?
                 // But AdminRfqsClient treats empty string as Default too (falsy check).
                 // So we can never have EMPTY status list.
                 // This is consistent with logic above.
                 params.delete(key);
             }
         } else if (value && (key === 'category')) {
             const current = params.get(key)?.split(',') || [];
             const newValues = current.filter(v => v !== value);
             if (newValues.length > 0) {
                 params.set(key, newValues.join(','));
             } else {
                 params.delete(key);
             }
         } else {
             params.delete(key);
         }
         replace(`${pathname}?${params.toString()}`);
    }

    // Active filters Logic
    const statusParam = searchParams.get('status');
    const activeStatuses = statusParam === null
        ? ['Received', 'In progress']
        : statusParam.split(',').filter(Boolean);
    const activeCategories = searchParams.get('category')?.split(',').filter(Boolean) || [];
    const activeUrgency = searchParams.get('urgency');
    const activeCountry = searchParams.get('country');
    const activeQuery = searchParams.get('q');

    // Default sort is newest (desc)
    const currentSort = searchParams.get('sort') || 'newest';

    const hasFilters = activeStatuses.length > 0 || activeCategories.length > 0 || activeUrgency || activeCountry || activeQuery;

    return (
        <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="w-full sm:max-w-xs">
                    <Input
                        placeholder="Search ID, Country..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10"
                    />
                </div>
                <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
                    {/* Status Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 border-dashed">
                                <Filter className="mr-2 h-4 w-4" />
                                Status
                                {activeStatuses.length > 0 && (
                                    <>
                                        <div className="ml-1 w-px h-4 bg-border" />
                                        <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal">
                                            {activeStatuses.length}
                                        </Badge>
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>Status</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {statuses.map((status) => (
                                <DropdownMenuCheckboxItem
                                    key={status}
                                    checked={activeStatuses.includes(status)}
                                    onCheckedChange={(checked) => handleStatusChange(status, checked)}
                                >
                                    {status}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Category Filter */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-10 border-dashed">
                                Category
                                {activeCategories.length > 0 && (
                                    <>
                                        <div className="ml-1 w-px h-4 bg-border" />
                                        <Badge variant="secondary" className="ml-1 rounded-sm px-1 font-normal">
                                            {activeCategories.length}
                                        </Badge>
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuLabel>Category</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {categories.map((cat) => (
                                <DropdownMenuCheckboxItem
                                    key={cat}
                                    checked={activeCategories.includes(cat)}
                                    onCheckedChange={(checked) => handleCategoryChange(cat, checked)}
                                >
                                    {cat}
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Urgency Filter */}
                    <Select value={activeUrgency || 'all'} onValueChange={handleUrgencyChange}>
                        <SelectTrigger className="h-10 w-[130px]">
                            <SelectValue placeholder="Urgency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Urgencies</SelectItem>
                            {urgencies.map((u) => (
                                <SelectItem key={u} value={u}>{u}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Country Filter */}
                    <Select value={activeCountry || 'all'} onValueChange={handleCountryChange}>
                        <SelectTrigger className="h-10 w-[150px]">
                            <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            {countries.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Sort */}
                    <Select value={currentSort} onValueChange={handleSortChange}>
                         <SelectTrigger className="h-10 w-[140px]">
                            <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder="Sort" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Date (Newest)</SelectItem>
                            <SelectItem value="oldest">Date (Oldest)</SelectItem>
                        </SelectContent>
                    </Select>

                     {hasFilters && (
                        <Button
                            variant="ghost"
                            onClick={clearAll}
                            className="h-10 px-2 lg:px-3"
                        >
                            Reset
                            <X className="ml-2 h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Active Filters Chips */}
            {hasFilters && (
                <div className="flex flex-wrap gap-2">
                     {activeQuery && (
                        <Badge variant="secondary" className="rounded-sm px-2 font-normal">
                            Search: {activeQuery}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto w-auto p-0 ml-2 hover:bg-transparent"
                                onClick={() => setSearch('')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                    {activeStatuses.map((status) => (
                        <Badge key={status} variant="secondary" className="rounded-sm px-2 font-normal">
                            Status: {status}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto w-auto p-0 ml-2 hover:bg-transparent"
                                onClick={() => clearFilter('status', status)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))}
                    {activeCategories.map((cat) => (
                        <Badge key={cat} variant="secondary" className="rounded-sm px-2 font-normal">
                            Category: {cat}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto w-auto p-0 ml-2 hover:bg-transparent"
                                onClick={() => clearFilter('category', cat)}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    ))}
                    {activeUrgency && (
                        <Badge variant="secondary" className="rounded-sm px-2 font-normal">
                            Urgency: {activeUrgency}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto w-auto p-0 ml-2 hover:bg-transparent"
                                onClick={() => clearFilter('urgency')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                     {activeCountry && (
                        <Badge variant="secondary" className="rounded-sm px-2 font-normal">
                            Country: {activeCountry}
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto w-auto p-0 ml-2 hover:bg-transparent"
                                onClick={() => clearFilter('country')}
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </Badge>
                    )}
                </div>
            )}
        </div>
    );
}
