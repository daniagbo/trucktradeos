'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MessageSquarePlus } from 'lucide-react';
import RfqWizard from './rfq-wizard';

export default function FloatingRfqButton() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    // Hide on RFQ pages and admin routes
    if (pathname?.startsWith('/rfq') || pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <Button
                onClick={() => setIsOpen(true)}
                size="lg"
                className="fixed bottom-6 right-6 z-40 h-14 rounded-full shadow-2xl hover:shadow-primary/20 hover:scale-105 transition-all duration-300 gap-2 px-6 animate-in fade-in slide-in-from-bottom-4"
                style={{
                    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                }}
            >
                <MessageSquarePlus className="h-5 w-5" />
                <span className="font-semibold">Request Sourcing</span>
            </Button>

            <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          }
          50% {
            box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1),
                        0 0 0 8px rgba(var(--primary-rgb), 0.1);
          }
        }
      `}</style>

            <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
                    <SheetHeader className="mb-6">
                        <SheetTitle className="text-2xl font-headline">Request Equipment Sourcing</SheetTitle>
                    </SheetHeader>
                    <RfqWizard />
                </SheetContent>
            </Sheet>
        </>
    );
}
