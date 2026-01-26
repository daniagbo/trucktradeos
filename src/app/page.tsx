'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRight, Search, Truck, ShieldCheck, Globe, Zap, BarChart3, ChevronRight } from 'lucide-react';
import ListingCard from '@/components/listings/listing-card';
import { useListings } from '@/hooks/use-listings';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Home() {
  const { listings } = useListings();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const featuredListings = listings.filter(l => l.visibility === 'public').slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (category !== 'all') params.set('category', category);
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.png"
            alt="Premium Heavy Equipment"
            fill
            className="object-cover scale-105 animate-in fade-in zoom-in duration-1000"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
        </div>

        <div className="container relative z-20 mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/90 text-white text-xs font-bold uppercase tracking-widest mb-6 animate-in slide-in-from-left duration-500 shadow-lg shadow-primary/20">
              <Zap className="h-3 w-3" />
              Next-Gen B2B Equipment Network
            </div>
            <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1] animate-in slide-in-from-left duration-700 drop-shadow-sm">
              Trade <span className="text-primary">Heavy Assets</span> with Precision.
            </h1>
            <p className="text-lg md:text-xl text-zinc-400 mb-10 leading-relaxed max-w-xl animate-in slide-in-from-left duration-1000">
              Access the world's most trusted marketplace for verified trucks, trailers, and industrial equipment. Real-time data, professional financing, and global logistics.
            </p>

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

            <div className="mt-8 flex items-center gap-6 animate-in fade-in duration-1000">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-10 w-10 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center overflow-hidden">
                    <Image src={`https://avatar.vercel.sh/user${i}.png`} alt="Vetted Buyer" width={40} height={40} />
                  </div>
                ))}
              </div>
              <div className="text-sm">
                <span className="text-white font-bold block">1,200+ Verified Dealerships</span>
                <span className="text-zinc-500">Trading daily on the OS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative z-20 -mt-10 mb-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { label: 'Platform Volume', value: '$420M+', icon: BarChart3 },
              { label: 'Active Assets', value: '18,500', icon: Truck },
              { label: 'Verified Partners', value: '940+', icon: ShieldCheck },
              { label: 'Avg. Sale Time', value: '14 Days', icon: Zap },
            ].map((stat, i) => (
              <Card key={i} className="bg-white border-border/50 shadow-lg hover:shadow-xl hover:border-primary/20 transition-all rounded-3xl p-6 group">
                <stat.icon className="h-6 w-6 text-primary mb-4 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Inventory */}
      <section className="py-24 relative overflow-hidden bg-grid">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="font-headline text-4xl font-bold text-foreground mb-4">Prime Inventory</h2>
              <p className="text-muted-foreground">Direct access to the market's most sought-after equipment. Vetted for technical integrity and ownership verification.</p>
            </div>
            <Button variant="link" className="text-primary font-bold group" onClick={() => router.push('/listings')}>
              Explore Full Market <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} isMember={false} />
            ))}
          </div>
        </div>
      </section>

      {/* Value Prop Section */}
      <section className="py-24 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl group border border-border/50">
              <Image
                src="https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2075&auto=format&fit=crop"
                alt="Operations"
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-20 w-20 rounded-full bg-white/20 border border-white/40 backdrop-blur-xl flex items-center justify-center animate-pulse">
                  <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40 leading-none">
                    <ArrowRight className="text-white h-6 w-6" />
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-headline text-3xl md:text-5xl font-bold text-foreground mb-8 leading-tight">
                The Operating System for <span className="text-primary italic">Global Equipment Trade.</span>
              </h3>
              <div className="space-y-8">
                {[
                  {
                    title: 'Verified Supply Chain',
                    desc: 'Every seller undergoes a rigorous 5-point verification process to ensure market integrity.',
                    icon: Globe
                  },
                  {
                    title: 'Financial Precision',
                    desc: 'Access embedded financing and leasing solutions tailored for heavy asset acquisition.',
                    icon: BarChart3
                  },
                  {
                    title: 'Automated Compliance',
                    desc: 'Genkit-powered documentation processing for faster cross-border compliance.',
                    icon: ShieldCheck
                  }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-white border border-border shadow-sm flex items-center justify-center text-primary">
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-foreground font-bold text-lg mb-2">{item.title}</h4>
                      <p className="text-muted-foreground leading-relaxed text-sm md:text-base">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="rounded-[40px] bg-primary overflow-hidden relative group">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/10 to-transparent skew-x-12 translate-x-1/2 group-hover:translate-x-1/3 transition-transform duration-1000" />

            <div className="relative z-10 p-12 md:p-20 text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="max-w-2xl">
                <h2 className="font-headline text-4xl md:text-6xl font-bold text-white mb-6">
                  Ready to Scale Your Fleet?
                </h2>
                <p className="text-white/80 text-lg md:text-xl font-medium">
                  Join the network of professional buyers and sellers today.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 shrink-0">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-bold px-10 h-16 rounded-2xl shadow-xl active:scale-95 transition-all text-lg" onClick={() => router.push('/register')}>
                  Create Free Account
                </Button>
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 text-white font-bold px-10 h-16 rounded-2xl active:scale-95 transition-all text-lg" onClick={() => router.push('/listings')}>
                  View Live Inventory
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
