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
