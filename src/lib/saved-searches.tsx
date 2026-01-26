'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { SavedSearch } from './types';

interface SavedSearchesContextType {
    savedSearches: SavedSearch[];
    addSearch: (name: string, filters: SavedSearch['filters']) => void;
    removeSearch: (id: string) => void;
    getNewMatchCount: (search: SavedSearch, totalListings: number) => number;
}

const SavedSearchesContext = createContext<SavedSearchesContextType | undefined>(undefined);

const STORAGE_KEY = 'marketplace_saved_searches';

export function SavedSearchesProvider({ children }: { children: ReactNode }) {
    const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                setSavedSearches(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load saved searches:', error);
        }
    }, []);

    // Save to localStorage whenever savedSearches changes
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(savedSearches));
        } catch (error) {
            console.error('Failed to save searches:', error);
        }
    }, [savedSearches]);

    const addSearch = (name: string, filters: SavedSearch['filters']) => {
        const newSearch: SavedSearch = {
            id: `search-${Date.now()}`,
            name,
            filters,
            createdAt: new Date().toISOString(),
            lastChecked: new Date().toISOString(),
        };
        setSavedSearches(prev => [...prev, newSearch]);
    };

    const removeSearch = (id: string) => {
        setSavedSearches(prev => prev.filter(s => s.id !== id));
    };

    const getNewMatchCount = (search: SavedSearch, totalListings: number) => {
        // Simplified: just return a placeholder count
        // In production, you'd filter listings based on search.filters and compare createdAt
        return 0;
    };

    return (
        <SavedSearchesContext.Provider value={{ savedSearches, addSearch, removeSearch, getNewMatchCount }}>
            {children}
        </SavedSearchesContext.Provider>
    );
}

export function useSavedSearches() {
    const context = useContext(SavedSearchesContext);
    if (!context) {
        throw new Error('useSavedSearches must be used within SavedSearchesProvider');
    }
    return context;
}
