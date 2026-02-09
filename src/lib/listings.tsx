'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Listing } from './types';
import { normalizeListing, toListingDbPayload } from './normalizers';

interface ListingsContextType {
  listings: Listing[];
  loading: boolean;
  getListing: (id: string) => Listing | undefined;
  addListing: (listing: Omit<Listing, 'id' | 'createdAt'>) => Promise<boolean>;
  updateListing: (id: string, updatedData: Partial<Listing>) => Promise<boolean>;
  deleteListing: (id: string) => Promise<boolean>;
  refreshListings: () => Promise<void>;
}

export const ListingsContext = createContext<ListingsContextType>({
  listings: [],
  loading: true,
  getListing: () => undefined,
  addListing: async () => false,
  updateListing: async () => false,
  deleteListing: async () => false,
  refreshListings: async () => { },
});

export const ListingsProvider = ({ children }: { children: ReactNode }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch public listings (default)
      // For Admin use cases, components might fetch directly or we could add an admin flag here
      // But for the global context, we'll fetch what's visible
      const res = await fetch('/api/listings?limit=100');
      if (res.ok) {
        const data = await res.json();
        setListings((data.listings || []).map(normalizeListing));
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const getListing = useCallback((id: string) => {
    return listings.find(listing => listing.id === id);
  }, [listings]);

  const addListing = async (listingData: Omit<Listing, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toListingDbPayload(listingData)),
      });

      if (res.ok) {
        await fetchListings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add listing:', error);
      return false;
    }
  };

  const updateListing = async (id: string, updatedData: Partial<Listing>) => {
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(toListingDbPayload(updatedData)),
      });

      if (res.ok) {
        await fetchListings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update listing:', error);
      return false;
    }
  };

  const deleteListing = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await fetchListings();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete listing:', error);
      return false;
    }
  };

  const value = { listings, loading, getListing, addListing, updateListing, deleteListing, refreshListings: fetchListings };

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
};
