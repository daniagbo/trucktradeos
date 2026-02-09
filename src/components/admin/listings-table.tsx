'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import {
  Eye,
  EyeOff,
  Filter,
  Globe,
  PackageCheck,
  PencilLine,
  Pin,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useListings } from '@/hooks/use-listings';
import { useToast } from '@/hooks/use-toast';
import type { AvailabilityStatus, Listing } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type Visibility = 'all' | 'public' | 'members' | 'hidden';
type SortBy = 'newest' | 'oldest' | 'title' | 'quantity';

type ListingFilterState = {
  searchQuery: string;
  visibilityFilter: Visibility;
  availabilityFilter: 'all' | AvailabilityStatus;
  verifiedOnly: boolean;
  exportReadyOnly: boolean;
  sortBy: SortBy;
};

type ListingPreset = {
  id: string;
  name: string;
  state: ListingFilterState;
};

const visibilityColors: Record<'public' | 'members' | 'hidden', string> = {
  public: 'bg-emerald-100 text-emerald-800',
  members: 'bg-blue-100 text-blue-800',
  hidden: 'bg-slate-100 text-slate-700',
};

const availabilityColors: Record<AvailabilityStatus, string> = {
  available: 'bg-green-100 text-green-700',
  expected: 'bg-amber-100 text-amber-700',
  reserved: 'bg-sky-100 text-sky-700',
  sold: 'bg-rose-100 text-rose-700',
};

function listingAge(listing: Listing) {
  return formatDistanceToNow(new Date(listing.createdAt), { addSuffix: true });
}

function makeState(
  searchQuery: string,
  visibilityFilter: Visibility,
  availabilityFilter: 'all' | AvailabilityStatus,
  verifiedOnly: boolean,
  exportReadyOnly: boolean,
  sortBy: SortBy
): ListingFilterState {
  return { searchQuery, visibilityFilter, availabilityFilter, verifiedOnly, exportReadyOnly, sortBy };
}

export default function ListingsTable() {
  const { listings, deleteListing, loading } = useListings();
  const { toast } = useToast();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<Visibility>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | AvailabilityStatus>('all');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [exportReadyOnly, setExportReadyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>('newest');
  const [presets, setPresets] = useState<ListingPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('none');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [watchedOnly, setWatchedOnly] = useState(false);
  const [watchlistSet, setWatchlistSet] = useState<Set<string>>(new Set());

  const loadPresets = async () => {
    try {
      const res = await fetch('/api/admin/views?scope=LISTINGS', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      const rows = Array.isArray(data.views) ? (data.views as Array<{ id: string; name: string; state: ListingFilterState }>) : [];
      setPresets(rows.map((row) => ({ id: row.id, name: row.name, state: row.state })));
    } catch (error) {
      console.error('Failed to load listing presets:', error);
    }
  };

  useEffect(() => {
    void loadPresets();
    void (async () => {
      try {
        const res = await fetch('/api/watchlist?entityType=LISTING', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        const ids = Array.isArray(data.items) ? data.items.map((item: { entityId: string }) => item.entityId) : [];
        setWatchlistSet(new Set(ids));
      } catch (error) {
        console.error('Failed to load listing watchlist:', error);
      }
    })();
  }, []);

  const currentState = useMemo(
    () => makeState(searchQuery, visibilityFilter, availabilityFilter, verifiedOnly, exportReadyOnly, sortBy),
    [availabilityFilter, exportReadyOnly, searchQuery, sortBy, verifiedOnly, visibilityFilter]
  );

  const applyState = (state: ListingFilterState) => {
    setSearchQuery(state.searchQuery);
    setVisibilityFilter(state.visibilityFilter);
    setAvailabilityFilter(state.availabilityFilter);
    setVerifiedOnly(state.verifiedOnly);
    setExportReadyOnly(state.exportReadyOnly);
    setSortBy(state.sortBy);
  };

  const filteredListings = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const rows = listings.filter((listing) => {
      if (visibilityFilter !== 'all' && listing.visibility !== visibilityFilter) return false;
      if (availabilityFilter !== 'all' && listing.availabilityStatus !== availabilityFilter) return false;
      if (verifiedOnly && listing.verificationStatus !== 'Verified') return false;
      if (exportReadyOnly && !listing.isExportReady) return false;
      if (watchedOnly && !watchlistSet.has(listing.id)) return false;
      if (!query) return true;
      return (
        listing.title.toLowerCase().includes(query) ||
        listing.brand.toLowerCase().includes(query) ||
        listing.category.toLowerCase().includes(query) ||
        listing.id.toLowerCase().includes(query)
      );
    });

    return rows.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'quantity') return b.quantity - a.quantity;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [availabilityFilter, exportReadyOnly, listings, searchQuery, sortBy, verifiedOnly, visibilityFilter, watchedOnly, watchlistSet]);

  const allFilteredSelected = filteredListings.length > 0 && filteredListings.every((item) => selectedIds.includes(item.id));

  const stats = useMemo(() => {
    const totalUnits = listings.reduce((acc, listing) => acc + (listing.quantity || 0), 0);
    return {
      totalListings: listings.length,
      totalUnits,
      publicCount: listings.filter((item) => item.visibility === 'public').length,
      memberCount: listings.filter((item) => item.visibility === 'members').length,
      hiddenCount: listings.filter((item) => item.visibility === 'hidden').length,
      verifiedCount: listings.filter((item) => item.verificationStatus === 'Verified').length,
      exportReadyCount: listings.filter((item) => item.isExportReady).length,
    };
  }, [listings]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count += 1;
    if (visibilityFilter !== 'all') count += 1;
    if (availabilityFilter !== 'all') count += 1;
    if (verifiedOnly) count += 1;
    if (exportReadyOnly) count += 1;
    if (watchedOnly) count += 1;
    if (sortBy !== 'newest') count += 1;
    return count;
  }, [availabilityFilter, exportReadyOnly, searchQuery, sortBy, verifiedOnly, visibilityFilter, watchedOnly]);

  const clearFilters = () => {
    applyState(makeState('', 'all', 'all', false, false, 'newest'));
    setWatchedOnly(false);
    setSelectedPresetId('none');
  };

  const toggleWatch = async (listingId: string) => {
    const watched = watchlistSet.has(listingId);
    const method = watched ? 'DELETE' : 'POST';
    const res = await fetch('/api/watchlist', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: 'LISTING', entityId: listingId }),
    });
    if (!res.ok) return;
    setWatchlistSet((prev) => {
      const next = new Set(prev);
      if (watched) next.delete(listingId);
      else next.add(listingId);
      return next;
    });
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => prev.filter((id) => !filteredListings.some((item) => item.id === id)));
      return;
    }
    const newIds = filteredListings.map((item) => item.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...newIds])));
  };

  const saveCurrentPreset = async () => {
    const name = window.prompt('Preset name');
    if (!name || !name.trim()) return;
    const res = await fetch('/api/admin/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        scope: 'LISTINGS',
        state: currentState,
      }),
    });
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Preset failed', description: 'Could not save this view.' });
      return;
    }
    const data = await res.json();
    const preset: ListingPreset = { id: data.view.id, name: data.view.name, state: data.view.state };
    setPresets((prev) => [preset, ...prev].slice(0, 10));
    setSelectedPresetId(preset.id);
    toast({ title: 'Preset saved', description: `Saved "${preset.name}".` });
  };

  const applyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (presetId === 'none') {
      clearFilters();
      return;
    }
    const preset = presets.find((item) => item.id === presetId);
    if (!preset) return;
    applyState(preset.state);
    toast({ title: 'Preset applied', description: `Applied "${preset.name}".` });
  };

  const removePreset = async () => {
    if (selectedPresetId === 'none') return;
    const target = presets.find((item) => item.id === selectedPresetId);
    const res = await fetch(`/api/admin/views/${selectedPresetId}`, { method: 'DELETE' });
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Delete failed', description: 'Could not remove this preset.' });
      return;
    }
    setPresets((prev) => prev.filter((item) => item.id !== selectedPresetId));
    setSelectedPresetId('none');
    if (target) {
      toast({ title: 'Preset removed', description: `Removed "${target.name}".` });
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    await deleteListing(itemToDelete);
    toast({ title: 'Listing deleted', description: 'The listing has been removed.' });
    setItemToDelete(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const confirmed = window.confirm(`Delete ${selectedIds.length} listings? This cannot be undone.`);
    if (!confirmed) return;
    for (const id of selectedIds) {
      await deleteListing(id);
    }
    toast({ title: 'Bulk delete complete', description: `${selectedIds.length} listings removed.` });
    setSelectedIds([]);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading listings...</p>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="fx-lift rounded-2xl border border-border bg-card p-4">
            <Eye className="h-4 w-4 text-primary" />
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Total listings</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalListings}</p>
          </div>
          <div className="fx-lift rounded-2xl border border-border bg-card p-4">
            <PackageCheck className="h-4 w-4 text-primary" />
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Total units</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalUnits}</p>
          </div>
          <div className="fx-lift rounded-2xl border border-border bg-card p-4">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Verified</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.verifiedCount}</p>
          </div>
          <div className="fx-lift rounded-2xl border border-border bg-card p-4">
            <Globe className="h-4 w-4 text-primary" />
            <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">Export ready</p>
            <p className="mt-1 text-2xl font-bold text-slate-900">{stats.exportReadyCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto]">
            <label className="relative flex h-11 items-center rounded-xl border border-border bg-muted/40 px-3">
              <Search className="h-4 w-4 text-slate-500" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search title, brand, category, or ID..."
                className="ml-2 h-full w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </label>
            <select
              value={visibilityFilter}
              onChange={(event) => setVisibilityFilter(event.target.value as Visibility)}
              className="h-11 rounded-xl border border-border bg-muted/40 px-3 text-sm font-semibold text-slate-700"
            >
              <option value="all">All visibility</option>
              <option value="public">Public</option>
              <option value="members">Members</option>
              <option value="hidden">Hidden</option>
            </select>
            <select
              value={availabilityFilter}
              onChange={(event) => setAvailabilityFilter(event.target.value as 'all' | AvailabilityStatus)}
              className="h-11 rounded-xl border border-border bg-muted/40 px-3 text-sm font-semibold text-slate-700"
            >
              <option value="all">All availability</option>
              <option value="available">Available</option>
              <option value="expected">Expected</option>
              <option value="reserved">Reserved</option>
              <option value="sold">Sold</option>
            </select>
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as SortBy)}
              className="h-11 rounded-xl border border-border bg-muted/40 px-3 text-sm font-semibold text-slate-700"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="title">Title A-Z</option>
              <option value="quantity">Highest quantity</option>
            </select>
          </div>

          <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
            <select
              value={selectedPresetId}
              onChange={(event) => applyPreset(event.target.value)}
              className="h-10 rounded-xl border border-border bg-muted/40 px-3 text-sm font-medium text-slate-700"
            >
              <option value="none">No saved view</option>
              {presets.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            <Button variant="outline" size="sm" className="h-10" onClick={saveCurrentPreset}>
              <Save className="mr-1 h-3.5 w-3.5" />
              Save current view
            </Button>
            <Button variant="ghost" size="sm" className="h-10" onClick={removePreset} disabled={selectedPresetId === 'none'}>
              Remove selected
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setVerifiedOnly((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${verifiedOnly ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified only
            </button>
            <button
              onClick={() => setExportReadyOnly((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${exportReadyOnly ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
            >
              <Globe className="h-3.5 w-3.5" />
              Export ready only
            </button>
            <button
              onClick={() => setWatchedOnly((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${watchedOnly ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border bg-card text-slate-600 hover:bg-muted/40'}`}
            >
              <Pin className="h-3.5 w-3.5" />
              Watched only
            </button>
            <Badge variant="secondary" className="gap-1 px-2 py-1 text-xs">
              <Filter className="h-3.5 w-3.5" />
              {activeFilterCount} active
            </Badge>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-3.5 w-3.5" />
                Reset filters
              </Button>
            )}
            {selectedIds.length > 0 && (
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                Delete selected ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-2xl border border-border bg-card p-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500">Public</p>
            <p className="mt-1 text-lg font-bold">{stats.publicCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500">Members</p>
            <p className="mt-1 text-lg font-bold">{stats.memberCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500">Hidden</p>
            <p className="mt-1 text-lg font-bold">{stats.hiddenCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500">Verified</p>
            <p className="mt-1 text-lg font-bold">{stats.verifiedCount}</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-3 text-sm text-slate-700">
            <p className="text-xs uppercase tracking-wide text-slate-500">Export ready</p>
            <p className="mt-1 text-lg font-bold">{stats.exportReadyCount}</p>
          </div>
        </div>

        {filteredListings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-sm text-slate-600">
            No listings found with current filters.
          </div>
        ) : (
          <>
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
              <table className="w-full">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3">
                      <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered} />
                    </th>
                    <th className="px-4 py-3">Listing</th>
                    <th className="px-4 py-3">Visibility</th>
                    <th className="px-4 py-3">Availability</th>
                    <th className="px-4 py-3">Units</th>
                    <th className="px-4 py-3">Age</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredListings.map((listing) => (
                    <tr key={listing.id} className="stagger-item border-t border-border text-sm transition-colors hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedIds.includes(listing.id)} onChange={() => toggleSelected(listing.id)} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{listing.title}</p>
                        <p className="text-xs text-slate-500">
                          {listing.brand} • {listing.category}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {listing.verificationStatus === 'Verified' && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                              Verified
                            </span>
                          )}
                          {listing.isExportReady && (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
                              Export ready
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold ${visibilityColors[listing.visibility]}`}>
                          {listing.visibility === 'members' ? <Users className="mr-1 inline h-3 w-3" /> : null}
                          {listing.visibility}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-semibold capitalize ${availabilityColors[listing.availabilityStatus]}`}>
                          {listing.availabilityStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-700">{listing.quantity}</td>
                      <td className="px-4 py-3 text-slate-700">{listingAge(listing)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => toggleWatch(listing.id)}
                            className={`inline-flex h-9 items-center rounded-lg border px-3 text-xs font-semibold ${watchlistSet.has(listing.id) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border text-slate-700 hover:bg-muted/50'}`}
                          >
                            <Pin className="mr-1 h-3.5 w-3.5" />
                            {watchlistSet.has(listing.id) ? 'Watched' : 'Watch'}
                          </button>
                          <Link href={`/admin/listings/${listing.id}/edit`} className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-xs font-semibold text-slate-700 hover:bg-muted/50">
                            <PencilLine className="mr-1 h-3.5 w-3.5" />
                            Edit
                          </Link>
                          <button
                            onClick={() => setItemToDelete(listing.id)}
                            className="inline-flex h-9 items-center rounded-lg border border-red-200 px-3 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="mr-1 h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="fx-lift rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{listing.title}</p>
                      <p className="text-xs text-slate-500">
                        {listing.brand} • {listing.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={selectedIds.includes(listing.id)} onChange={() => toggleSelected(listing.id)} />
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold ${visibilityColors[listing.visibility]}`}>
                        {listing.visibility === 'public' && <Eye className="mr-1 inline h-3 w-3" />}
                        {listing.visibility === 'hidden' && <EyeOff className="mr-1 inline h-3 w-3" />}
                        {listing.visibility}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2 py-1 text-[11px] font-semibold capitalize ${availabilityColors[listing.availabilityStatus]}`}>
                      {listing.availabilityStatus}
                    </span>
                    {listing.verificationStatus === 'Verified' && (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">
                        Verified
                      </span>
                    )}
                    {listing.isExportReady && (
                      <span className="rounded-full bg-sky-100 px-2 py-1 text-[11px] font-semibold text-sky-700">
                        Export ready
                      </span>
                    )}
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
                      Qty {listing.quantity}
                    </span>
                    {watchlistSet.has(listing.id) && (
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
                        Watched
                      </span>
                    )}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">Updated {listingAge(listing)}</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => toggleWatch(listing.id)}
                      className={`inline-flex h-9 flex-1 items-center justify-center rounded-lg border text-xs font-semibold ${watchlistSet.has(listing.id) ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-border text-slate-700'}`}
                    >
                      <Pin className="mr-1 h-3.5 w-3.5" />
                      {watchlistSet.has(listing.id) ? 'Watched' : 'Watch'}
                    </button>
                    <Link href={`/admin/listings/${listing.id}/edit`} className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-border text-xs font-semibold text-slate-700">
                      <PencilLine className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Link>
                    <button
                      onClick={() => setItemToDelete(listing.id)}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-red-200 text-xs font-semibold text-red-600"
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <AlertDialog open={Boolean(itemToDelete)} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete listing?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The listing and related metadata will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
