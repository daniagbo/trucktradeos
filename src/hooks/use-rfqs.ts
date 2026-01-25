'use client';
import { useContext } from 'react';
import { RfqsContext } from '@/lib/rfqs';

export const useRfqs = () => {
  const context = useContext(RfqsContext);
  if (context === undefined) {
    throw new Error('useRfqs must be used within a RfqsProvider');
  }
  return context;
};
