'use client';
import { useContext } from 'react';
import { ListingsContext } from '@/lib/listings';

export const useListings = () => {
  const context = useContext(ListingsContext);
  if (context === undefined) {
    throw new Error('useListings must be used within a ListingsProvider');
  }
  return context;
};
