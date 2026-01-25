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

export type RFQStatus = 'Received' | 'In progress' | 'Offer sent' | 'Closed';

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
};

export type RFQMessage = {
  id: string;
  rfqId: string;
  senderId: string;
  senderType: 'buyer' | 'admin';
  message: string;
  createdAt: string;
};

export type RFQFile = {
  id: string;
  rfqId: string;
  fileName: string;
  url: string;
  type: 'offer';
  createdAt: string;
};

// --- RFQ Types End ---
