'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell } from 'lucide-react';
import { useSavedSearches } from '@/lib/saved-searches';
import { useToast } from '@/hooks/use-toast';

interface SaveSearchButtonProps {
    currentFilters: {
        search?: string;
        category?: string[];
        brand?: string[];
        yearMin?: number | null;
        yearMax?: number | null;
        country?: string[];
        condition?: string[];
        type?: string[];
        quantityMin?: number | null;
        isExportReady?: boolean;
        availabilityStatus?: string[];
    };
}

export default function SaveSearchButton({ currentFilters }: SaveSearchButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchName, setSearchName] = useState('');
    const { addSearch } = useSavedSearches();
    const { toast } = useToast();

    const handleSave = () => {
        if (!searchName.trim()) {
            toast({
                title: 'Name required',
                description: 'Please enter a name for your saved search.',
                variant: 'destructive',
            });
            return;
        }

        addSearch(searchName, currentFilters);
        toast({
            title: 'Search saved!',
            description: `"${searchName}" has been saved to your searches.`,
        });
        setSearchName('');
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full gap-2" size="sm">
                    <Bell className="h-4 w-4" />
                    Save This Search
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Save Search</DialogTitle>
                    <DialogDescription>
                        Save your current filters to quickly access them later.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Search Name</Label>
                        <Input
                            id="name"
                            placeholder="e.g. 2019+ Euro 6 Trucks under €50k"
                            value={searchName}
                            onChange={(e) => setSearchName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save Search</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
