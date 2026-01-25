import type { User, Listing } from './types';
import { PlaceHolderImages } from './placeholder-images';

const getImage = (id: string) => PlaceHolderImages.find(img => img.id === id);

export const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'admin@marketplace.com',
    passwordHash: 'hashedpassword',
    role: 'admin',
    accountType: 'company',
    name: 'Admin User',
    phone: '123-456-7890',
    country: 'Netherlands',
    companyName: 'Marketplace Inc.',
    vat: 'NL123456789B01',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    email: 'member@marketplace.com',
    passwordHash: 'hashedpassword',
    role: 'member',
    accountType: 'company',
    name: 'Member User',
    phone: '098-765-4321',
    country: 'Germany',
    companyName: 'Transport GmbH',
    vat: 'DE987654321',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-3',
    email: 'individual@marketplace.com',
    passwordHash: 'hashedpassword',
    role: 'member',
    accountType: 'individual',
    name: 'Individual Buyer',
    phone: '555-555-5555',
    country: 'USA',
    createdAt: new Date().toISOString(),
  },
];

export const mockListings: Listing[] = [
  {
    id: 'listing-1',
    title: '2022 Scania R 450',
    category: 'Truck',
    brand: 'Scania',
    model: 'R 450',
    year: 2022,
    condition: 'Excellent',
    country: 'Germany',
    city: 'Berlin',
    description: 'Almost new Scania R 450 with low mileage. Used for light-duty transport within the city. Maintained by certified mechanics. All service records available. No accidents, clean title.',
    specs: [
      { key: 'Mileage', value: '50,000 km' },
      { key: 'Engine', value: 'DC13 156' },
      { key: 'Power', value: '450 HP' },
      { key: 'Gearbox', value: 'Opticruise' },
    ],
    visibility: 'public',
    createdAt: new Date('2023-10-01').toISOString(),
    media: [
      { id: 'img1', url: getImage('truck-1')?.imageUrl!, imageHint: getImage('truck-1')?.imageHint!, sortOrder: 1 },
      { id: 'img2', url: getImage('truck-interior-1')?.imageUrl!, imageHint: getImage('truck-interior-1')?.imageHint!, sortOrder: 2 },
      { id: 'img3', url: getImage('truck-engine-1')?.imageUrl!, imageHint: getImage('truck-engine-1')?.imageHint!, sortOrder: 3 },
    ],
    extraNotes: 'Available for inspection on weekdays. Price negotiable for serious buyers. Financing options available through our partners.'
  },
  {
    id: 'listing-2',
    title: '2019 Volvo FH 500',
    category: 'Truck',
    brand: 'Volvo',
    model: 'FH 500',
    year: 2019,
    condition: 'Good',
    country: 'Netherlands',
    city: 'Rotterdam',
    description: 'Well-maintained Volvo FH 500, single owner, used for long-haul routes across Europe. Reliable and fuel-efficient. Regular services performed at Volvo service centers.',
    specs: [
      { key: 'Mileage', value: '320,000 km' },
      { key: 'Engine', value: 'D13K500' },
      { key: 'Power', value: '500 HP' },
      { key: 'Cabin', value: 'Globetrotter XL' },
    ],
    visibility: 'public',
    createdAt: new Date('2023-09-15').toISOString(),
    media: [
      { id: 'img4', url: getImage('truck-2')?.imageUrl!, imageHint: getImage('truck-2')?.imageHint!, sortOrder: 1 },
    ],
    extraNotes: 'Tires replaced 6 months ago. Minor cosmetic wear on the driver side door. Full documentation available for members.'
  },
  {
    id: 'listing-3',
    title: 'Komatsu PC210 Excavator',
    category: 'Heavy Equipment',
    brand: 'Komatsu',
    model: 'PC210',
    year: 2020,
    condition: 'Good',
    country: 'USA',
    city: 'Houston, TX',
    description: 'Komatsu PC210 excavator with standard bucket. Used in residential construction projects. Low operating hours for its age.',
    specs: [
      { key: 'Hours', value: '2,500' },
      { key: 'Weight', value: '22 tons' },
      { key: 'Engine', value: 'Komatsu SAA6D107E-1' },
      { key: 'Condition', value: 'Good' },
    ],
    visibility: 'public',
    createdAt: new Date('2023-11-05').toISOString(),
    media: [
      { id: 'img5', url: getImage('equipment-1')?.imageUrl!, imageHint: getImage('equipment-1')?.imageHint!, sortOrder: 1 },
    ],
    extraNotes: 'Hydraulics recently serviced. Available for immediate pickup.'
  },
  {
    id: 'listing-4',
    title: 'Schmitz Cargobull Flatbed Trailer',
    category: 'Trailer',
    brand: 'Schmitz Cargobull',
    year: 2021,
    condition: 'Excellent',
    country: 'Poland',
    city: 'Warsaw',
    description: 'Like new Schmitz Cargobull flatbed trailer. Minimal use, stored indoors. Perfect for various cargo types.',
    specs: [
      { key: 'Length', value: '13.6 m' },
      { key: 'Axles', value: '3' },
      { key: 'Payload', value: '27,000 kg' },
    ],
    visibility: 'public',
    createdAt: new Date('2023-10-20').toISOString(),
    media: [
      { id: 'img6', url: getImage('trailer-1')?.imageUrl!, imageHint: getImage('trailer-1')?.imageHint!, sortOrder: 1 },
    ],
    extraNotes: 'Inspection reports available upon request for members.'
  },
  {
    id: 'listing-5',
    title: 'Caterpillar D6 Bulldozer',
    category: 'Heavy Equipment',
    brand: 'Caterpillar',
    model: 'D6',
    year: 2018,
    condition: 'Used',
    country: 'Canada',
    city: 'Calgary',
    description: 'CAT D6 bulldozer, fully operational. Has seen significant use in mining operations but has been professionally maintained. Strong and reliable machine.',
    specs: [
        { key: 'Hours', value: '8,200' },
        { key: 'Blade', value: 'SU Blade' },
        { key: 'Undercarriage', value: '50% life remaining' },
    ],
    visibility: 'members',
    createdAt: new Date('2023-08-01').toISOString(),
    media: [
        { id: 'img7', url: getImage('equipment-2')?.imageUrl!, imageHint: getImage('equipment-2')?.imageHint!, sortOrder: 1 },
    ],
    extraNotes: 'This listing is only visible to logged-in members. Full maintenance logs are attached as documents.'
  },
];
