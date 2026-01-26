'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { BookmarkCheck, Trash2, Search } from 'lucide-react';
import { useSavedSearches } from '@/lib/saved-searches';
import { useToast } from '@/hooks/use-toast';

interface SavedSearchesDrawerProps {
    onApplySearch: (filters: any) => void;
}

export default function SavedSearchesDrawer({ onApplySearch }: SavedSearchesDrawerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const { savedSearches, removeSearch } = useSavedSearches();
    const { toast } = useToast();

    const handleApply = (search: any) => {
        onApplySearch(search.filters);
        setIsOpen(false);
        toast({
            title: 'Search applied',
            description: `Applied filters from "${search.name}"`,
        });
    };

    const handleDelete = (id: string, name: string) => {
        removeSearch(id);
        toast({
            title: 'Search deleted',
            description: `"${name}" has been removed.`,
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full gap-2">
                    <BookmarkCheck className="h-4 w-4" />
                    My Saved Searches
                    {savedSearches.length > 0 && (
                        <Badge variant="secondary" className="ml-auto">
                            {savedSearches.length}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Saved Searches</SheetTitle>
                    <SheetDescription>
                        Quickly access your saved filter combinations.
                    </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-3">
                    {savedSearches.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <BookmarkCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm">No saved searches yet.</p>
                            <p className="text-xs mt-1">Save your current filters to access them quickly later.</p>
                        </div>
                    ) : (
                        savedSearches.map((search) => (
                            <div
                                key={search.id}
                                className="p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="font-medium text-sm">{search.name}</h4>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                                        onClick={() => handleDelete(search.id, search.name)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground mb-3">
                                    Saved {new Date(search.createdAt).toLocaleDateString()}
                                </p>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full gap-2"
                                    onClick={() => handleApply(search)}
                                >
                                    <Search className="h-3.5 w-3.5" />
                                    Apply Search
                                </Button>
                            </div>
                        ))
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
