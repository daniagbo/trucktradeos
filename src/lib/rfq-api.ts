import type { Offer, OfferStatus, RFQ, RFQEvent, RFQMessage, RFQStatus } from '@/lib/types';
import type { Offer as DbOffer, RFQ as DbRfq, RFQEvent as DbRfqEvent, RFQMessage as DbRfqMessage } from '@prisma/client';

type RfqWithRelations = DbRfq & {
  offers: DbOffer[];
  messages: DbRfqMessage[];
  events: DbRfqEvent[];
};

const UI_TO_DB_STATUS: Record<RFQStatus, 'RECEIVED' | 'REVIEWING' | 'OFFER_SENT' | 'PENDING_EXECUTION' | 'WON' | 'LOST'> = {
  Received: 'RECEIVED',
  'In progress': 'REVIEWING',
  'Offer sent': 'OFFER_SENT',
  'Pending execution': 'PENDING_EXECUTION',
  Won: 'WON',
  Lost: 'LOST',
};

const DB_TO_UI_STATUS: Record<string, RFQStatus> = {
  RECEIVED: 'Received',
  REVIEWING: 'In progress',
  OFFER_SENT: 'Offer sent',
  PENDING_EXECUTION: 'Pending execution',
  WON: 'Won',
  LOST: 'Lost',
};

const DB_TO_UI_TIER: Record<string, NonNullable<RFQ['serviceTier']>> = {
  STANDARD: 'Standard',
  PRIORITY: 'Priority',
  ENTERPRISE: 'Enterprise',
};

const UI_TO_DB_OFFER_STATUS: Record<OfferStatus, 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED'> = {
  Draft: 'DRAFT',
  Sent: 'SENT',
  Accepted: 'ACCEPTED',
  Declined: 'DECLINED',
  Expired: 'EXPIRED',
};

const DB_TO_UI_OFFER_STATUS: Record<string, OfferStatus> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  EXPIRED: 'Expired',
};

type PayloadData = Partial<
  Pick<
    RFQ,
    | 'yearMin'
    | 'yearMax'
    | 'budgetMin'
    | 'budgetMax'
    | 'pickupDeadline'
    | 'requiredDocuments'
    | 'conditionTolerance'
    | 'notes'
    | 'keySpecs'
    | 'businessGoal'
    | 'riskTolerance'
    | 'budgetConfidence'
    | 'mandateCompleteness'
    | 'servicePackage'
    | 'packageAddons'
  >
>;

function getPayloadData(events: DbRfqEvent[]): PayloadData {
  const payloadEvent = [...events].reverse().find((event) => event.type === 'rfq_payload');
  if (!payloadEvent) return {};
  const payload = payloadEvent.payload as Record<string, unknown>;
  return {
    yearMin: typeof payload.yearMin === 'number' ? payload.yearMin : undefined,
    yearMax: typeof payload.yearMax === 'number' ? payload.yearMax : undefined,
    budgetMin: typeof payload.budgetMin === 'number' ? payload.budgetMin : undefined,
    budgetMax: typeof payload.budgetMax === 'number' ? payload.budgetMax : undefined,
    pickupDeadline: typeof payload.pickupDeadline === 'string' ? new Date(payload.pickupDeadline) : undefined,
    requiredDocuments: Array.isArray(payload.requiredDocuments) ? payload.requiredDocuments.filter((item): item is string => typeof item === 'string') : undefined,
    conditionTolerance: typeof payload.conditionTolerance === 'string' ? payload.conditionTolerance : undefined,
    notes: typeof payload.notes === 'string' ? payload.notes : undefined,
    keySpecs: typeof payload.keySpecs === 'string' ? payload.keySpecs : undefined,
    businessGoal: typeof payload.businessGoal === 'string' ? payload.businessGoal : undefined,
    riskTolerance: typeof payload.riskTolerance === 'string' ? payload.riskTolerance as RFQ['riskTolerance'] : undefined,
    budgetConfidence: typeof payload.budgetConfidence === 'string' ? payload.budgetConfidence as RFQ['budgetConfidence'] : undefined,
    mandateCompleteness: typeof payload.mandateCompleteness === 'number' ? payload.mandateCompleteness : undefined,
    servicePackage: typeof payload.servicePackage === 'string' ? payload.servicePackage as RFQ['servicePackage'] : undefined,
    packageAddons: Array.isArray(payload.packageAddons)
      ? payload.packageAddons.filter((item): item is NonNullable<RFQ['packageAddons']>[number] => typeof item === 'string')
      : undefined,
  };
}

export function toDbRfqStatus(status: RFQStatus) {
  return UI_TO_DB_STATUS[status];
}

export function toDbOfferStatus(status: OfferStatus) {
  return UI_TO_DB_OFFER_STATUS[status];
}

export function mapRfqModel(rfq: RfqWithRelations): RFQ {
  const payload = getPayloadData(rfq.events);
  const keySpecs = payload.keySpecs || rfq.requirements || '';

  return {
    id: rfq.id,
    userId: rfq.userId,
    listingId: rfq.listingId || undefined,
    category: (rfq.category as RFQ['category']) || 'Truck',
    keySpecs,
    preferredBrands: rfq.brand || undefined,
    yearMin: payload.yearMin,
    yearMax: payload.yearMax,
    budgetMin: payload.budgetMin,
    budgetMax: payload.budgetMax,
    deliveryCountry: rfq.budget || 'Unknown',
    pickupDeadline: payload.pickupDeadline,
    urgency: rfq.urgency === 'Urgent' ? 'Urgent' : 'Normal',
    serviceTier: DB_TO_UI_TIER[rfq.serviceTier] || 'Standard',
    servicePackage: payload.servicePackage || 'Core',
    packageAddons: payload.packageAddons || [],
    slaTargetHours: rfq.slaTargetHours,
    requiredDocuments: payload.requiredDocuments || [],
    conditionTolerance: payload.conditionTolerance || 'Used',
    notes: payload.notes,
    businessGoal: payload.businessGoal,
    riskTolerance: payload.riskTolerance,
    budgetConfidence: payload.budgetConfidence,
    mandateCompleteness: payload.mandateCompleteness,
    status: DB_TO_UI_STATUS[rfq.status] || 'Received',
    createdAt: rfq.createdAt.toISOString(),
    internalOpsNotes: rfq.internalOpsNotes || undefined,
    closeReason: rfq.closeReason || undefined,
    events: rfq.events.map((event) => ({
      id: event.id,
      type: event.type as RFQEvent['type'],
      timestamp: event.timestamp.toISOString(),
      payload: event.payload as RFQEvent['payload'],
    })),
  };
}

export function mapOfferModel(offer: DbOffer): Offer {
  return {
    id: offer.id,
    rfqId: offer.rfqId,
    listingId: offer.listingId || undefined,
    title: offer.title,
    price: offer.price || undefined,
    currency: offer.currency,
    terms: offer.terms || undefined,
    location: offer.location || undefined,
    availabilityText: offer.availabilityText || undefined,
    validUntil: offer.validUntil.toISOString(),
    includedFlags: (offer.includedFlags as Record<string, boolean>) || {},
    notes: offer.notes || undefined,
    status: DB_TO_UI_OFFER_STATUS[offer.status] || 'Draft',
    createdAt: offer.createdAt.toISOString(),
    sentAt: offer.sentAt?.toISOString(),
    versionNumber: offer.versionNumber,
    declineReason: offer.declineReason || undefined,
  };
}

export function mapMessageModel(message: DbRfqMessage): RFQMessage {
  return {
    id: message.id,
    rfqId: message.rfqId,
    senderId: message.senderType === 'admin' ? 'admin' : 'buyer',
    senderType: message.senderType === 'admin' ? 'admin' : 'buyer',
    message: message.message,
    createdAt: message.createdAt.toISOString(),
  };
}
