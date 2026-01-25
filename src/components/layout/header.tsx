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
import { LayoutDashboard, LogOut, Settings, Truck, User as UserIcon } from 'lucide-react';
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
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left">
        <div className="flex flex-col gap-4 p-4">
          <Link href="/" className="flex items-center gap-2 mb-4" onClick={() => setMobileMenuOpen(false)}>
            <Logo />
            <span className="font-bold font-headline text-lg">Marketplace</span>
          </Link>
          <Link href="/listings" className="text-lg" onClick={() => setMobileMenuOpen(false)}>Listings</Link>
          {user && (
            <>
              <Link href="/dashboard" className="text-lg" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              {user.role === 'admin' && <Link href="/admin/listings" className="text-lg" onClick={() => setMobileMenuOpen(false)}>Admin</Link>}
            </>
          )}
          <div className="mt-auto">
             {user ? (
              <div className="flex flex-col gap-2">
                 <Button asChild variant="outline" className="w-full justify-start"><Link href="/profile"><Settings className="mr-2 h-4 w-4" />Profile</Link></Button>
                 <Button onClick={() => { logout(); setMobileMenuOpen(false); }} variant="ghost" className="w-full justify-start"><LogOut className="mr-2 h-4 w-4" />Logout</Button>
              </div>
             ) : (
              <div className="flex flex-col gap-2">
                 <Button asChild className="w-full"><Link href="/login">Login</Link></Button>
                 <Button asChild variant="secondary" className="w-full"><Link href="/register">Register</Link></Button>
              </div>
             )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <span className="font-bold font-headline">B2B Marketplace</span>
          </Link>
        </div>
        
        <div className="md:hidden">
          <MobileNav />
        </div>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="hidden md:flex md:flex-1 items-center gap-6 text-sm">
             <NavLink href="/listings">Listings</NavLink>
          </div>
          <nav className="flex items-center gap-4">
            {!loading && (
              <>
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={`https://avatar.vercel.sh/${user.email}.png`} alt={user.name} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.name}</p>
                          <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard"><LayoutDashboard className="mr-2 h-4 w-4" />Dashboard</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/profile"><Settings className="mr-2 h-4 w-4" />Profile</Link>
                      </DropdownMenuItem>
                      {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                           <Link href="/admin/listings"><Truck className="mr-2 h-4 w-4" />Manage Listings</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <Button asChild variant="ghost">
                      <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild>
                      <Link href="/register">Register</Link>
                    </Button>
                  </div>
                )}
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
