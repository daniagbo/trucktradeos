'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { Listing } from './types';
import { mockListings } from './mock-data';

interface ListingsContextType {
  listings: Listing[];
  loading: boolean;
  getListing: (id: string) => Listing | undefined;
  addListing: (listing: Listing) => void;
  updateListing: (id: string, updatedData: Partial<Listing>) => void;
  deleteListing: (id: string) => void;
}

export const ListingsContext = createContext<ListingsContextType>({
  listings: [],
  loading: true,
  getListing: () => undefined,
  addListing: () => {},
  updateListing: () => {},
  deleteListing: () => {},
});

const LISTINGS_STORAGE_KEY = 'b2b_marketplace_listings';

export const ListingsProvider = ({ children }: { children: ReactNode }) => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize from mock data if not in localStorage
    const storedListings = localStorage.getItem(LISTINGS_STORAGE_KEY);
    if (!storedListings) {
      localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(mockListings));
      setListings(mockListings);
    } else {
      setListings(JSON.parse(storedListings));
    }
    setLoading(false);
  }, []);

  const getListing = useCallback((id: string) => {
    return listings.find(listing => listing.id === id);
  }, [listings]);

  const addListing = (listing: Listing) => {
    const updatedListings = [listing, ...listings];
    setListings(updatedListings);
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(updatedListings));
  };

  const updateListing = (id: string, updatedData: Partial<Listing>) => {
    const updatedListings = listings.map(l => 
      l.id === id ? { ...l, ...updatedData } : l
    );
    setListings(updatedListings);
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(updatedListings));
  };

  const deleteListing = (id: string) => {
    const updatedListings = listings.filter(l => l.id !== id);
    setListings(updatedListings);
    localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(updatedListings));
  };
  
  const value = { listings, loading, getListing, addListing, updateListing, deleteListing };

  return <ListingsContext.Provider value={value}>{children}</ListingsContext.Provider>;
};
