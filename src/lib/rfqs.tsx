'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { RFQ, RFQMessage, RFQStatus, Offer, OfferStatus } from './types';
import { useToast } from '@/hooks/use-toast';

interface RfqsContextType {
  rfqs: RFQ[];
  messages: RFQMessage[];
  offers: Offer[];
  loading: boolean;
  getRfqsForUser: (userId: string) => RFQ[];
  getRfqById: (id: string) => RFQ | undefined;
  getMessagesForRfq: (rfqId: string) => RFQMessage[];
  getOffersForRfq: (rfqId: string) => Offer[];
  addRfq: (rfqData: Omit<RFQ, 'id' | 'createdAt' | 'status' | 'events'>) => Promise<RFQ>;
  updateRfqStatus: (rfqId: string, status: RFQStatus) => void;
  updateRfqInternalNotes: (rfqId: string, notes: string) => void;
  addMessage: (messageData: Omit<RFQMessage, 'id' | 'createdAt'>) => void;
  addOffer: (offerData: Omit<Offer, 'id' | 'createdAt' | 'status' | 'versionNumber'>) => Promise<Offer>;
  updateOfferStatus: (offerId: string, status: OfferStatus, reason?: string) => void;
  closeRfq: (rfqId: string, status: 'Won' | 'Lost', reason: string) => void;
}

export const RfqsContext = createContext<RfqsContextType | undefined>(undefined);

export const RfqsProvider = ({ children }: { children: ReactNode }) => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [messages, setMessages] = useState<RFQMessage[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const refreshRfqs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/rfqs', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch RFQs');
      const data = await res.json();
      setRfqs(data.rfqs || []);
      setMessages(data.messages || []);
      setOffers(data.offers || []);
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Failed to load RFQs', description: 'Please refresh and try again.' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshRfqs();
  }, [refreshRfqs]);

  const getRfqsForUser = useCallback((userId: string) => {
    return rfqs.filter(rfq => rfq.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rfqs]);

  const getRfqById = useCallback((id: string) => {
    return rfqs.find(rfq => rfq.id === id);
  }, [rfqs]);

  const getMessagesForRfq = useCallback((rfqId: string) => {
    return messages.filter(msg => msg.rfqId === rfqId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  const getOffersForRfq = useCallback((rfqId: string) => {
    return offers.filter(o => o.rfqId === rfqId).sort((a, b) => b.versionNumber - a.versionNumber);
  }, [offers]);

  const addRfq = useCallback(async (rfqData: Omit<RFQ, 'id' | 'createdAt' | 'status' | 'events'>): Promise<RFQ> => {
    const res = await fetch('/api/rfqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rfqData),
    });
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Submission Failed', description: 'Could not submit sourcing request.' });
      throw new Error('Failed to create RFQ');
    }
    const data = await res.json();
    await refreshRfqs();
    toast({ title: 'Request Submitted', description: 'Your sourcing request has been received.' });
    return data.rfq as RFQ;
  }, [refreshRfqs, toast]);

  const updateRfqInternalNotes = useCallback((rfqId: string, notes: string) => {
    void (async () => {
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalOpsNotes: notes }),
      });
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not update internal note.' });
        return;
      }
      await refreshRfqs();
      toast({ title: 'Note Saved', description: 'Internal note has been updated.' });
    })();
  }, [refreshRfqs, toast]);

  const addMessage = useCallback((messageData: Omit<RFQMessage, 'id' | 'createdAt'>) => {
    void (async () => {
      const res = await fetch(`/api/rfqs/${messageData.rfqId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messageData),
      });
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Message Failed', description: 'Could not send message.' });
        return;
      }
      await refreshRfqs();
    })();
  }, [refreshRfqs, toast]);

  const addOffer = useCallback(async (offerData: Omit<Offer, 'id' | 'createdAt' | 'status' | 'versionNumber'>): Promise<Offer> => {
    const res = await fetch(`/api/rfqs/${offerData.rfqId}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(offerData),
    });
    if (!res.ok) {
      toast({ variant: 'destructive', title: 'Offer Failed', description: 'Could not create offer.' });
      throw new Error('Failed to create offer');
    }
    const data = await res.json();
    await refreshRfqs();
    toast({ title: 'Offer Sent', description: 'The offer has been sent to the buyer.' });
    return data.offer as Offer;
  }, [refreshRfqs, toast]);


  const updateOfferStatus = useCallback((offerId: string, status: OfferStatus, reason?: string) => {
    void (async () => {
      const res = await fetch(`/api/offers/${offerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason }),
      });
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not update offer status.' });
        return;
      }
      await refreshRfqs();
      if (status === 'Accepted') {
        toast({ title: 'Offer Accepted!', description: 'Next steps have been initiated.' });
      } else if (status === 'Declined') {
        toast({ title: 'Offer Declined', description: 'The buyer has declined the offer.' });
      }
    })();
  }, [refreshRfqs, toast]);


  const closeRfq = useCallback((rfqId: string, status: 'Won' | 'Lost', reason: string) => {
    void (async () => {
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closeStatus: status, closeReason: reason }),
      });
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Close Failed', description: 'Could not close RFQ.' });
        return;
      }
      await refreshRfqs();
      toast({ title: `RFQ Closed as ${status}`, description: 'The RFQ has been moved to a final state.' });
    })();
  }, [refreshRfqs, toast]);

  const updateRfqStatus = useCallback((rfqId: string, status: RFQStatus) => {
    void (async () => {
      const res = await fetch(`/api/rfqs/${rfqId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        toast({ variant: 'destructive', title: 'Status Failed', description: 'Could not update RFQ status.' });
        return;
      }
      await refreshRfqs();
      toast({ title: 'Status Updated', description: `RFQ status changed to ${status}.` });
    })();
  }, [refreshRfqs, toast]);


  const value: RfqsContextType = {
    rfqs,
    messages,
    offers,
    loading,
    getRfqsForUser,
    getRfqById,
    getMessagesForRfq,
    getOffersForRfq,
    addRfq,
    updateRfqStatus,
    addMessage,
    updateRfqInternalNotes,
    addOffer,
    updateOfferStatus,
    closeRfq,
  };

  return <RfqsContext.Provider value={value}>{children}</RfqsContext.Provider>;
};
