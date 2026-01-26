'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { RFQ, RFQMessage, RFQStatus, Offer, OfferStatus, RFQEvent } from './types';
import { mockRfqs, mockRfqMessages, mockOffers } from './mock-rfq-data';
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

const RFQS_STORAGE_KEY = 'b2b_marketplace_rfqs';
const RFQ_MESSAGES_STORAGE_KEY = 'b2b_marketplace_rfq_messages';
const OFFERS_STORAGE_KEY = 'b2b_marketplace_offers';

export const RfqsProvider = ({ children }: { children: ReactNode }) => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [messages, setMessages] = useState<RFQMessage[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedRfqs = localStorage.getItem(RFQS_STORAGE_KEY);
    if (!storedRfqs) {
      localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(mockRfqs));
      setRfqs(mockRfqs);
    } else {
      setRfqs(JSON.parse(storedRfqs));
    }

    const storedMessages = localStorage.getItem(RFQ_MESSAGES_STORAGE_KEY);
    if (!storedMessages) {
      localStorage.setItem(RFQ_MESSAGES_STORAGE_KEY, JSON.stringify(mockRfqMessages));
      setMessages(mockRfqMessages);
    } else {
      setMessages(JSON.parse(storedMessages));
    }

    const storedOffers = localStorage.getItem(OFFERS_STORAGE_KEY);
    if (!storedOffers) {
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(mockOffers));
      setOffers(mockOffers);
    } else {
      setOffers(JSON.parse(storedOffers));
    }

    setLoading(false);
  }, []);

  const addEventToRfq = useCallback((rfqId: string, eventData: Omit<RFQEvent, 'id' | 'timestamp'>) => {
    setRfqs(prevRfqs => {
      const newRfqs = prevRfqs.map(r => {
        if (r.id === rfqId) {
          const newEvent: RFQEvent = {
            ...eventData,
            id: `event-${Date.now()}`,
            timestamp: new Date().toISOString(),
          };
          return { ...r, events: [...r.events, newEvent] };
        }
        return r;
      });
      localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(newRfqs));
      return newRfqs;
    });
  }, []);

  const updateRfqStatus = useCallback((rfqId: string, status: RFQStatus) => {
    const rfq = rfqs.find(r => r.id === rfqId);
    if (rfq && rfq.status === status) return; // Avoid redundant updates and events

    setRfqs(prevRfqs => {
      const updatedRfqs = prevRfqs.map(r => r.id === rfqId ? { ...r, status } : r);
      localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(updatedRfqs));
      return updatedRfqs;
    });

    addEventToRfq(rfqId, { type: 'status_change', payload: { status } });
    toast({ title: 'Status Updated', description: `RFQ status changed to ${status}.` });
  }, [rfqs, toast, addEventToRfq]);


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
    const newRfq: RFQ = {
      ...rfqData,
      id: `rfq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Received',
      events: [],
    };

    addEventToRfq(newRfq.id, { type: 'status_change', payload: { status: 'Received' } });

    const updatedRfqs = [newRfq, ...rfqs];
    setRfqs(updatedRfqs);
    localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(updatedRfqs));

    toast({ title: 'Request Submitted', description: 'Your sourcing request has been received.' });
    return newRfq;
  }, [rfqs, toast, addEventToRfq]);

  const updateRfqInternalNotes = useCallback((rfqId: string, notes: string) => {
    const updatedRfqs = rfqs.map(r => r.id === rfqId ? { ...r, internalOpsNotes: notes } : r);
    setRfqs(updatedRfqs);
    localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(updatedRfqs));
    toast({ title: 'Note Saved', description: 'Internal note has been updated.' });
  }, [rfqs, toast]);

  const addMessage = useCallback((messageData: Omit<RFQMessage, 'id' | 'createdAt'>) => {
    const newMessage: RFQMessage = {
      ...messageData,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    localStorage.setItem(RFQ_MESSAGES_STORAGE_KEY, JSON.stringify(updatedMessages));

    addEventToRfq(newMessage.rfqId, { type: 'message', payload: { message: newMessage.message, author: messageData.senderType === 'admin' ? 'Admin' : 'Buyer' } });
  }, [messages, addEventToRfq]);

  const addOffer = useCallback(async (offerData: Omit<Offer, 'id' | 'createdAt' | 'status' | 'versionNumber'>): Promise<Offer> => {
    const existingOffers = offers.filter(o => o.rfqId === offerData.rfqId);
    const newVersion = existingOffers.length > 0 ? Math.max(...existingOffers.map(o => o.versionNumber)) + 1 : 1;

    const newOffer: Offer = {
      ...offerData,
      id: `offer-${Date.now()}`,
      createdAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      status: 'Sent',
      versionNumber: newVersion,
    };

    const updatedOffers = [newOffer, ...offers];
    setOffers(updatedOffers);
    localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(updatedOffers));

    updateRfqStatus(newOffer.rfqId, 'Offer sent');
    addEventToRfq(newOffer.rfqId, {
      type: 'offer_sent',
      payload: { offerId: newOffer.id, title: newOffer.title }
    });

    toast({ title: 'Offer Sent', description: 'The offer has been sent to the buyer.' });
    return newOffer;
  }, [offers, toast, updateRfqStatus, addEventToRfq]);


  const updateOfferStatus = useCallback((offerId: string, status: OfferStatus, reason?: string) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    if (status === 'Accepted') {
      // Decline all other offers for this RFQ
      const otherOfferIds = offers.filter(o => o.rfqId === offer.rfqId && o.id !== offerId).map(o => o.id);
      const updatedOffers = offers.map(o => {
        if (o.id === offerId) return { ...o, status: 'Accepted' };
        if (otherOfferIds.includes(o.id)) return { ...o, status: 'Declined' as OfferStatus, declineReason: 'Another offer was accepted.' };
        return o;
      });
      setOffers(updatedOffers as Offer[]);
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(updatedOffers));
      updateRfqStatus(offer.rfqId, 'Pending execution');
      addEventToRfq(offer.rfqId, { type: 'offer_accepted', payload: { offerId: offer.id, title: offer.title } });
      toast({ title: 'Offer Accepted!', description: 'Next steps have been initiated.' });

    } else {
      const updatedOffers = offers.map(o => o.id === offerId ? { ...o, status, declineReason: reason } : o);
      setOffers(updatedOffers);
      localStorage.setItem(OFFERS_STORAGE_KEY, JSON.stringify(updatedOffers));

      if (status === 'Declined') {
        addEventToRfq(offer.rfqId, { type: 'offer_declined', payload: { offerId: offer.id, title: offer.title, reason } });
        toast({ title: 'Offer Declined', description: 'The buyer has declined the offer.' });
      }
    }
  }, [offers, toast, updateRfqStatus, addEventToRfq]);


  const closeRfq = useCallback((rfqId: string, status: 'Won' | 'Lost', reason: string) => {
    const updatedRfqs = rfqs.map(r => r.id === rfqId ? { ...r, status, closeReason: reason } : r);
    setRfqs(updatedRfqs);
    localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(updatedRfqs));
    addEventToRfq(rfqId, { type: 'rfq_closed', payload: { status, reason } });
    toast({ title: `RFQ Closed as ${status}`, description: `The RFQ has been moved to a final state.` });
  }, [rfqs, toast, addEventToRfq]);


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
