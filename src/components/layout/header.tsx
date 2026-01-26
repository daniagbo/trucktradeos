'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LayoutDashboard, LogOut, Settings, Truck, User as UserIcon, FileText } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu } from 'lucide-react';
import { useState } from 'react';

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        'text-sm font-medium transition-colors hover:text-primary',
        isActive ? 'text-primary' : 'text-muted-foreground'
      )}
    >
      {children}
    </Link>
  );
};

export default function Header() {
  const { user, logout, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getInitials = (name: string = '') => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const MobileNav = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-foreground">
          <Menu />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="glass-dark border-r-white/10 text-foreground">
        <div className="flex flex-col gap-6 p-6">
          <Link href="/" className="flex items-center gap-2 mb-8" onClick={() => setMobileMenuOpen(false)}>
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Logo className="text-white h-6 w-6" />
            </div>
            <span className="font-bold font-headline text-xl tracking-tight">TruckTradeOS</span>
          </Link>
          <Link href="/listings" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Inventory</Link>
          <Link href="#" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>How it Works</Link>
          <Link href="#" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Sourcing Request</Link>
          {user && (
            <>
              <div className="h-px bg-white/10 my-2" />
              <Link href="/dashboard" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link href="/dashboard/rfqs" className="text-lg font-medium hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>Sourcing Requests</Link>
            </>
          )}
          <div className="mt-auto pt-8">
            {user ? (
              <div className="flex flex-col gap-3">
                <Button asChild variant="outline" className="w-full justify-start border-white/10 hover:bg-white/5 truncate">
                  <Link href="/profile"><Settings className="mr-3 h-4 w-4" />{user.name}</Link>
                </Button>
                <Button onClick={() => { logout(); setMobileMenuOpen(false); }} variant="ghost" className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-400/10">
                  <LogOut className="mr-3 h-4 w-4" />Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <Button asChild className="w-full shadow-lg shadow-primary/20"><Link href="/login">Sign In</Link></Button>
                <Button asChild variant="outline" className="w-full border-white/10 bg-white/5"><Link href="/register">Create Account</Link></Button>
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="fixed top-0 z-50 w-full transition-all duration-300">
      <div className="container mx-auto px-4">
        <div className="mt-4 flex h-16 items-center justify-between rounded-2xl glass border border-white/10 px-4 md:px-8 shadow-2xl">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                <Logo className="text-white h-5 w-5" />
              </div>
              <span className="font-bold font-headline text-lg tracking-tight hidden sm:inline-block">TruckTradeOS</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium">
              <NavLink href="/listings">Inventory</NavLink>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">How it Works</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Sourcing Request</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="md:hidden">
              <MobileNav />
            </div>

            <nav className="flex items-center gap-4">
              {!loading && (
                <>
                  {user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full ring-2 ring-primary/20 hover:ring-primary/40 transition-all">
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                            <AvatarFallback className="bg-primary/10 text-primary">{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-64 glass border-white/10 mt-2" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1 p-1">
                            <p className="text-sm font-semibold leading-none">{user.name}</p>
                            <p className="text-xs leading-none text-muted-foreground mt-1">{user.email}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-white/10" />
                        <div className="p-1">
                          <DropdownMenuItem asChild className="rounded-lg focus:bg-primary/10 cursor-pointer">
                            <Link href="/dashboard"><LayoutDashboard className="mr-3 h-4 w-4 text-primary" />Dashboard</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-lg focus:bg-primary/10 cursor-pointer">
                            <Link href="/dashboard/rfqs"><FileText className="mr-3 h-4 w-4 text-primary" />Sourcing Requests</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-lg focus:bg-primary/10 cursor-pointer">
                            <Link href="/profile"><Settings className="mr-3 h-4 w-4 text-primary" />Settings</Link>
                          </DropdownMenuItem>
                        </div>
                        {user.role === 'admin' && (
                          <>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground opacity-60">Admin Control</div>
                            <div className="p-1">
                              <DropdownMenuItem asChild className="rounded-lg focus:bg-red-400/10 cursor-pointer">
                                <Link href="/admin/listings"><Truck className="mr-3 h-4 w-4 text-primary" />Inventory Sync</Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild className="rounded-lg focus:bg-red-400/10 cursor-pointer">
                                <Link href="/admin/rfqs"><FileText className="mr-3 h-4 w-4 text-primary" />Market Deals</Link>
                              </DropdownMenuItem>
                            </div>
                          </>
                        )}
                        <DropdownMenuSeparator className="bg-white/10" />
                        <div className="p-1">
                          <DropdownMenuItem onClick={logout} className="rounded-lg focus:bg-red-400/10 text-red-400 cursor-pointer">
                            <LogOut className="mr-3 h-4 w-4" />
                            <span>Sign Out</span>
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="hidden md:flex items-center gap-3">
                      <Button asChild variant="ghost" className="hover:bg-white/5 active:scale-95 transition-all">
                        <Link href="/login">Sign In</Link>
                      </Button>
                      <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 rounded-xl px-6 active:scale-95 transition-all">
                        <Link href="/register">Get Started</Link>
                      </Button>
                    </div>
                  )}
                </>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
