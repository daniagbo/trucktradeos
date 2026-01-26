import Link from 'next/link';
import { Logo } from '@/components/icons';

export default function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Logo className="text-white h-6 w-6" />
              </div>
              <span className="font-bold font-headline text-2xl tracking-tight">TruckTradeOS</span>
            </Link>
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              The professional standard for heavy equipment commerce. Scaling logistics through verified data and trusted partnerships.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary/80">Platform</h4>
            <nav className="flex flex-col gap-4">
              <Link href="/listings" className="text-muted-foreground hover:text-primary transition-colors">Inventory</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Auctions</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Financing</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Sell Equipment</Link>
            </nav>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary/80">Company</h4>
            <nav className="flex flex-col gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Compliance</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms</Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy</Link>
            </nav>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} TruckTradeOS. All rights reserved.
          </div>
          <div className="flex gap-6">
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Twitter</Link>
            <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">LinkedIn</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
