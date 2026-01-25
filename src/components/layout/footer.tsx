import Link from 'next/link';
import { Logo } from '@/components/icons';

export default function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="font-bold font-headline">B2B Marketplace</span>
          </div>
          <nav className="flex gap-4 mt-4 md:mt-0">
            <Link href="/listings" className="text-sm text-muted-foreground hover:text-primary">
              Listings
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              About Us
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Terms of Service
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary">
              Privacy Policy
            </Link>
          </nav>
        </div>
        <div className="mt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} B2B Marketplace, Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
