export type Spec = {
  key: string;
  value: string;
};

export type ListingMedia = {
  id: string;
  url: string;
  imageHint: string;
  sortOrder: number;
};

export type VerificationStatus = 'Unverified' | 'Pending' | 'Verified';

export type ListingDocument = {
  id: string;
  name: string;
  type: 'Registration' | 'COC' | 'Inspection' | 'Maintenance';
  url: string;
  createdAt: string;
};

export type InternalNote = {
  id: string;
  note: string;
  authorId: string;
  createdAt: string;
};

export type Listing = {
  id: string;
  title: string;
  category: 'Trailer' | 'Truck' | 'Heavy Equipment';
  brand: string;
  model?: string;
  year?: number;
  condition: 'Excellent' | 'Good' | 'Used' | 'As-is';
  country: string;
  city?: string;
  description: string;
  specs: Spec[];
  visibility: 'public' | 'members' | 'hidden';
  createdAt: string;
  media: ListingMedia[];
  extraNotes?: string;
  // Phase 3
  verificationStatus: VerificationStatus;
  documents: ListingDocument[];
  internalNotes: InternalNote[];
};

export type UserAccountType = 'individual' | 'company';
export type UserRole = 'member' | 'admin';

export type User = {
  id: string;
  email: string;
  passwordHash: string; // In a real app, this would never be sent to the client
  role: UserRole;
  accountType: UserAccountType;
  name: string;
  phone?: string;
  country?: string;
  companyName?: string;
  vat?: string;
  createdAt: string;
};

// --- RFQ Types Start ---

export type RFQStatus = 'Received' | 'In progress' | 'Offer sent' | 'Pending execution' | 'Won' | 'Lost';
export type OfferStatus = 'Draft' | 'Sent' | 'Accepted' | 'Declined' | 'Expired';

export type Offer = {
    id: string;
    rfqId: string;
    listingId?: string;
    title: string;
    price?: number;
    currency?: string;
    terms?: string;
    location?: string;
    availabilityText?: string;
    validUntil: string;
    includedFlags: { [key: string]: boolean };
    notes?: string;
    status: OfferStatus;
    createdAt: string;
    sentAt?: string;
    versionNumber: number;
    declineReason?: string;
};

export type OfferFile = {
  id: string;
  offerId: string;
  name: string;
  url: string;
  createdAt: string;
};


export type RFQEvent = {
    id: string;
    type: 'status_change' | 'message' | 'offer_sent' | 'offer_accepted' | 'offer_declined' | 'rfq_closed';
    timestamp: string;
    payload: {
        status?: RFQStatus | OfferStatus;
        message?: string;
        author?: string;
        offerId?: string;
        title?: string;
        reason?: string;
    }
};

export type RFQUrgency = 'Normal' | 'Urgent';

export type RFQ = {
  id: string;
  userId: string;
  listingId?: string; // Optional reference to a listing
  category: 'Trailer' | 'Truck' | 'Heavy Equipment';
  keySpecs: string; // Free text for now
  preferredBrands?: string;
  yearMin?: number;
  yearMax?: number;
  budgetMin?: number;
  budgetMax?: number;
  deliveryCountry: string;
  pickupDeadline?: Date;
  urgency: RFQUrgency;
  requiredDocuments: string[];
  conditionTolerance: string;
  notes?: string;
  status: RFQStatus;
  createdAt: string;
  // Phase 3
  internalOpsNotes?: string;
  // Phase 4
  closeReason?: string;
  events: RFQEvent[];
};

export type RFQMessage = {
  id: string;
  rfqId: string;
  senderId: string;
  senderType: 'buyer' | 'admin';
  message: string;
  createdAt: string;
};

// --- RFQ Types End ---
