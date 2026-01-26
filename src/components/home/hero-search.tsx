'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function HeroSearch() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (category !== 'all') params.set('category', category);
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSearch} className="animate-in slide-in-from-bottom duration-1000">
      <div className="p-2 rounded-2xl glass border-white/20 shadow-2xl flex flex-col md:flex-row gap-2 max-w-xl">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
          <Input
            type="text"
            placeholder="Search model, brand, or VIN..."
            className="bg-white/10 border-white/10 h-14 pl-12 text-white placeholder:text-zinc-300 rounded-xl focus:ring-primary/50 focus:bg-white/20 transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full md:w-[160px] h-14 bg-white/10 border-white/10 text-white rounded-xl focus:ring-primary/50 focus:bg-white/20 transition-all">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="glass border-white/10 text-white">
            <SelectItem value="all">All Specs</SelectItem>
            <SelectItem value="Trailer">Trailers</SelectItem>
            <SelectItem value="Truck">Trucks</SelectItem>
            <SelectItem value="Heavy Equipment">Machines</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit" size="lg" className="h-14 px-8 rounded-xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">
          Search
        </Button>
      </div>
    </form>
  );
}
