'use client';

import { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import type { RFQ, RFQMessage, RFQStatus } from './types';
import { mockRfqs, mockRfqMessages } from './mock-rfq-data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface RfqsContextType {
  rfqs: RFQ[];
  messages: RFQMessage[];
  loading: boolean;
  getRfqsForUser: (userId: string) => RFQ[];
  getRfqById: (id: string) => RFQ | undefined;
  getMessagesForRfq: (rfqId: string) => RFQMessage[];
  addRfq: (rfqData: Omit<RFQ, 'id' | 'createdAt' | 'status'>) => Promise<RFQ>;
  updateRfqStatus: (rfqId: string, status: RFQStatus) => void;
  updateRfqInternalNotes: (rfqId: string, notes: string) => void;
  addMessage: (messageData: Omit<RFQMessage, 'id' | 'createdAt'>) => void;
}

export const RfqsContext = createContext<RfqsContextType>({
  rfqs: [],
  messages: [],
  loading: true,
  getRfqsForUser: () => [],
  getRfqById: () => undefined,
  getMessagesForRfq: () => [],
  addRfq: async () => ({} as RFQ),
  updateRfqStatus: () => {},
  updateRfqInternalNotes: () => {},
  addMessage: () => {},
});

const RFQS_STORAGE_KEY = 'b2b_marketplace_rfqs';
const RFQ_MESSAGES_STORAGE_KEY = 'b2b_marketplace_rfq_messages';

export const RfqsProvider = ({ children }: { children: ReactNode }) => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [messages, setMessages] = useState<RFQMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

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

    setLoading(false);
  }, []);

  const getRfqsForUser = useCallback((userId: string) => {
    return rfqs.filter(rfq => rfq.userId === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [rfqs]);

  const getRfqById = useCallback((id: string) => {
    return rfqs.find(rfq => rfq.id === id);
  }, [rfqs]);
  
  const getMessagesForRfq = useCallback((rfqId: string) => {
    return messages.filter(msg => msg.rfqId === rfqId).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [messages]);

  const addRfq = useCallback(async (rfqData: Omit<RFQ, 'id' | 'createdAt' | 'status'>): Promise<RFQ> => {
    const newRfq: RFQ = {
      ...rfqData,
      id: `rfq-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'Received',
    };

    const updatedRfqs = [newRfq, ...rfqs];
    setRfqs(updatedRfqs);
    localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(updatedRfqs));
    
    toast({ title: 'Request Submitted', description: 'Your sourcing request has been received.' });
    return newRfq;
  }, [rfqs, toast]);

  const updateRfqStatus = useCallback((rfqId: string, status: RFQStatus) => {
    const updatedRfqs = rfqs.map(r => r.id === rfqId ? { ...r, status } : r);
    setRfqs(updatedRfqs);
    localStorage.setItem(RFQS_STORAGE_KEY, JSON.stringify(updatedRfqs));
    toast({ title: 'Status Updated', description: `RFQ status changed to ${status}.`});
  }, [rfqs, toast]);

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
  }, [messages]);

  const value = {
    rfqs,
    messages,
    loading,
    getRfqsForUser,
    getRfqById,
    getMessagesForRfq,
    addRfq,
    updateRfqStatus,
    addMessage,
    updateRfqInternalNotes,
  };

  return <RfqsContext.Provider value={value}>{children}</RfqsContext.Provider>;
};
