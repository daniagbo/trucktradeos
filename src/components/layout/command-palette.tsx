'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { User } from '@/lib/types';

type CommandItem = {
  id: string;
  label: string;
  href: string;
  keywords: string[];
  auth?: 'public' | 'user' | 'admin';
};

const ITEMS: CommandItem[] = [
  { id: 'home', label: 'Home', href: '/', keywords: ['home', 'landing'], auth: 'public' },
  { id: 'listings', label: 'Inventory', href: '/listings', keywords: ['listings', 'inventory'], auth: 'public' },
  { id: 'bulk', label: 'Bulk Sourcing', href: '/bulk-sourcing', keywords: ['bulk', 'sourcing'], auth: 'public' },
  { id: 'rfq-new', label: 'New Request', href: '/rfq/new', keywords: ['new', 'request', 'rfq'], auth: 'user' },
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', keywords: ['dashboard', 'overview'], auth: 'user' },
  { id: 'my-rfqs', label: 'My Requests', href: '/dashboard/rfqs', keywords: ['my', 'rfq', 'requests'], auth: 'user' },
  { id: 'profile', label: 'Profile', href: '/profile', keywords: ['profile', 'account'], auth: 'user' },
  { id: 'admin-listings', label: 'Admin Listings', href: '/admin/listings', keywords: ['admin', 'listings'], auth: 'admin' },
  { id: 'admin-rfqs', label: 'Admin RFQs', href: '/admin/rfqs', keywords: ['admin', 'rfq', 'inbox'], auth: 'admin' },
  { id: 'admin-insights', label: 'Admin Insights', href: '/admin/insights', keywords: ['admin', 'insights', 'analytics'], auth: 'admin' },
  { id: 'admin-automation', label: 'Admin Automation', href: '/admin/automation', keywords: ['admin', 'automation', 'runs', 'rules'], auth: 'admin' },
  { id: 'admin-settings', label: 'Admin Settings', href: '/admin/settings', keywords: ['admin', 'settings', 'policy', 'team'], auth: 'admin' },
  { id: 'login', label: 'Sign in', href: '/login', keywords: ['login', 'sign in'], auth: 'public' },
  { id: 'register', label: 'Create account', href: '/register', keywords: ['register', 'signup'], auth: 'public' },
];

interface CommandPaletteProps {
  user: User | null;
}

function allow(item: CommandItem, user: User | null) {
  if (item.auth === 'admin') return user?.role === 'admin';
  if (item.auth === 'user') return !!user;
  if (item.id === 'login' || item.id === 'register') return !user;
  return true;
}

export default function CommandPalette({ user }: CommandPaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS
      .filter((item) => allow(item, user))
      .filter((item) => {
        if (!q) return true;
        return (
          item.label.toLowerCase().includes(q) ||
          item.href.toLowerCase().includes(q) ||
          item.keywords.some((keyword) => keyword.includes(q))
        );
      })
      .slice(0, 8);
  }, [query, user]);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    router.push(href);
  };

  return (
    <>
      <Button variant="outline" className="hidden h-10 gap-2 md:flex" onClick={() => setOpen(true)}>
        <Search className="h-4 w-4" />
        <span className="text-sm">Command</span>
        <span className="ml-1 rounded border border-border px-1.5 py-0.5 text-[11px] text-slate-500">⌘K</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Command className="h-4 w-4" />
              Quick command palette
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              autoFocus
              placeholder="Type a page or action..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border">
              {results.length === 0 ? (
                <p className="p-3 text-sm text-slate-500">No matching commands.</p>
              ) : (
                results.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => go(item.href)}
                    className="flex w-full items-center justify-between border-b border-border px-3 py-2 text-left last:border-b-0 hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-900">{item.label}</span>
                    <span className="text-xs text-slate-500">{item.href}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
