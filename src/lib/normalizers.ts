import type { Listing, ListingDocument, User } from '@/lib/types';

type RawRecord = Record<string, unknown>;

const CATEGORY_TO_UI: Record<string, Listing['category']> = {
  TRUCK: 'Truck',
  TRAILER: 'Trailer',
  HEAVY_EQUIPMENT: 'Heavy Equipment',
  Truck: 'Truck',
  Trailer: 'Trailer',
  'Heavy Equipment': 'Heavy Equipment',
};

const CONDITION_TO_UI: Record<string, Listing['condition']> = {
  EXCELLENT: 'Excellent',
  GOOD: 'Good',
  USED: 'Used',
  AS_IS: 'As-is',
  'As-is': 'As-is',
  Excellent: 'Excellent',
  Good: 'Good',
  Used: 'Used',
};

const VISIBILITY_TO_UI: Record<string, Listing['visibility']> = {
  PUBLIC: 'public',
  MEMBERS: 'members',
  HIDDEN: 'hidden',
  public: 'public',
  members: 'members',
  hidden: 'hidden',
};

const VERIFICATION_TO_UI: Record<string, Listing['verificationStatus']> = {
  UNVERIFIED: 'Unverified',
  PENDING: 'Pending',
  VERIFIED: 'Verified',
  Unverified: 'Unverified',
  Pending: 'Pending',
  Verified: 'Verified',
};

const AVAILABILITY_TO_UI: Record<string, Listing['availabilityStatus']> = {
  AVAILABLE: 'available',
  EXPECTED: 'expected',
  RESERVED: 'reserved',
  SOLD: 'sold',
  available: 'available',
  expected: 'expected',
  reserved: 'reserved',
  sold: 'sold',
};

const TYPE_TO_UI: Record<string, Listing['type']> = {
  SINGLE: 'single',
  LOT: 'lot',
  single: 'single',
  lot: 'lot',
};

const DOC_TYPE_TO_UI: Record<string, ListingDocument['type']> = {
  REGISTRATION: 'Registration',
  COC: 'COC',
  INSPECTION: 'Inspection',
  MAINTENANCE: 'Maintenance',
  Registration: 'Registration',
  Inspection: 'Inspection',
  Maintenance: 'Maintenance',
};

const CATEGORY_TO_DB: Record<Listing['category'], string> = {
  Truck: 'TRUCK',
  Trailer: 'TRAILER',
  'Heavy Equipment': 'HEAVY_EQUIPMENT',
};

const CONDITION_TO_DB: Record<Listing['condition'], string> = {
  Excellent: 'EXCELLENT',
  Good: 'GOOD',
  Used: 'USED',
  'As-is': 'AS_IS',
};

const VISIBILITY_TO_DB: Record<Listing['visibility'], string> = {
  public: 'PUBLIC',
  members: 'MEMBERS',
  hidden: 'HIDDEN',
};

const VERIFICATION_TO_DB: Record<Listing['verificationStatus'], string> = {
  Unverified: 'UNVERIFIED',
  Pending: 'PENDING',
  Verified: 'VERIFIED',
};

const AVAILABILITY_TO_DB: Record<Listing['availabilityStatus'], string> = {
  available: 'AVAILABLE',
  expected: 'EXPECTED',
  reserved: 'RESERVED',
  sold: 'SOLD',
};

const TYPE_TO_DB: Record<Listing['type'], string> = {
  single: 'SINGLE',
  lot: 'LOT',
};

const DOC_TYPE_TO_DB: Record<ListingDocument['type'], string> = {
  Registration: 'REGISTRATION',
  COC: 'COC',
  Inspection: 'INSPECTION',
  Maintenance: 'MAINTENANCE',
};

function asString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function normalizeUser(raw: unknown): User | null {
  if (!raw || typeof raw !== 'object') return null;
  const source = raw as RawRecord;
  const role = asString(source.role);
  const accountType = asString(source.accountType);
  const teamRole = asString(source.teamRole);

  return {
    ...(source as User),
    mustChangePassword: Boolean(source.mustChangePassword),
    role: role?.toLowerCase() === 'admin' ? 'admin' : 'member',
    teamRole:
      teamRole?.toLowerCase() === 'approver'
        ? 'approver'
        : teamRole?.toLowerCase() === 'manager'
          ? 'manager'
          : teamRole?.toLowerCase() === 'owner'
            ? 'owner'
            : 'requester',
    accountType: accountType?.toLowerCase() === 'company' ? 'company' : 'individual',
  };
}

export function normalizeListing(raw: unknown): Listing {
  const source = raw as RawRecord;
  const category = asString(source.category);
  const condition = asString(source.condition);
  const visibility = asString(source.visibility);
  const verificationStatus = asString(source.verificationStatus);
  const availabilityStatus = asString(source.availabilityStatus);
  const type = asString(source.type);

  const documents = Array.isArray(source.documents)
    ? source.documents.map((doc) => {
      const item = doc as RawRecord;
      const docType = asString(item.type);
      return {
        ...(item as ListingDocument),
        type: DOC_TYPE_TO_UI[docType || ''] || 'Registration',
      };
    })
    : [];

  return {
    ...(source as Listing),
    category: CATEGORY_TO_UI[category || ''] || 'Truck',
    condition: CONDITION_TO_UI[condition || ''] || 'Used',
    visibility: VISIBILITY_TO_UI[visibility || ''] || 'public',
    verificationStatus: VERIFICATION_TO_UI[verificationStatus || ''] || 'Unverified',
    availabilityStatus: AVAILABILITY_TO_UI[availabilityStatus || ''] || 'available',
    type: TYPE_TO_UI[type || ''] || 'single',
    specs: Array.isArray(source.specs) ? (source.specs as Listing['specs']) : [],
    media: Array.isArray(source.media) ? (source.media as Listing['media']) : [],
    documents,
    internalNotes: Array.isArray(source.internalNotes) ? (source.internalNotes as Listing['internalNotes']) : [],
  };
}

export function toListingDbPayload(listing: Partial<Listing>) {
  const payload: Record<string, unknown> = { ...listing };

  if (listing.category) payload.category = CATEGORY_TO_DB[listing.category];
  if (listing.condition) payload.condition = CONDITION_TO_DB[listing.condition];
  if (listing.visibility) payload.visibility = VISIBILITY_TO_DB[listing.visibility];
  if (listing.verificationStatus) payload.verificationStatus = VERIFICATION_TO_DB[listing.verificationStatus];
  if (listing.availabilityStatus) payload.availabilityStatus = AVAILABILITY_TO_DB[listing.availabilityStatus];
  if (listing.type) payload.type = TYPE_TO_DB[listing.type];

  if (Array.isArray(listing.documents)) {
    payload.documents = listing.documents.map((doc) => ({
      ...doc,
      type: DOC_TYPE_TO_DB[doc.type],
    }));
  }

  return payload;
}
