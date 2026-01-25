import type { RFQ, RFQMessage, Offer } from './types';

export const mockRfqs: RFQ[] = [
    {
        id: 'rfq-1',
        userId: 'user-2', // Member User
        listingId: 'listing-1',
        category: 'Truck',
        keySpecs: 'Needs to have a sleeper cab and automatic gearbox.',
        preferredBrands: 'Scania, Volvo',
        yearMin: 2020,
        budgetMax: 100000,
        deliveryCountry: 'Germany',
        urgency: 'Normal',
        requiredDocuments: ['Service History', 'Registration'],
        conditionTolerance: 'Good or better',
        notes: 'Looking for a reliable truck for international routes. The referenced listing is a good example of what I need.',
        status: 'Offer sent',
        createdAt: new Date('2024-07-28T10:00:00Z').toISOString(),
        internalOpsNotes: 'Buyer seems serious. Have a good match in inventory for this one. Should prepare an offer.',
        events: [
            { id: 'event-1', type: 'status_change', timestamp: new Date('2024-07-28T10:00:00Z').toISOString(), payload: { status: 'Received' }},
            { id: 'event-2', type: 'offer_sent', timestamp: new Date('2024-07-30T09:05:00Z').toISOString(), payload: { offerId: 'offer-1', title: 'Offer for 2019 Volvo FH 500' }}
        ],
    },
    {
        id: 'rfq-2',
        userId: 'user-3', // Individual Buyer
        category: 'Heavy Equipment',
        keySpecs: 'At least 20-ton capacity excavator.',
        yearMin: 2018,
        deliveryCountry: 'USA',
        urgency: 'Urgent',
        requiredDocuments: ['Inspection Report'],
        conditionTolerance: 'Used is acceptable',
        notes: 'Need this for a project starting next month. Open to different brands but prefer CAT or Komatsu.',
        status: 'In progress',
        createdAt: new Date('2024-07-29T14:30:00Z').toISOString(),
        internalOpsNotes: 'Urgent request. Need to check with suppliers in Texas for availability.',
        events: [
            { id: 'event-3', type: 'status_change', timestamp: new Date('2024-07-29T14:30:00Z').toISOString(), payload: { status: 'Received' }},
            { id: 'event-4', type: 'status_change', timestamp: new Date('2024-07-29T15:00:00Z').toISOString(), payload: { status: 'In progress' }},
            { id: 'event-5', type: 'message', timestamp: new Date('2024-07-29T16:00:00Z').toISOString(), payload: { message: 'Thanks for your request. We are currently looking for matching equipment. We have a few options in our network that might fit. I will get back to you with a concrete offer soon.', author: 'Admin' }},
            { id: 'event-6', type: 'message', timestamp: new Date('2024-07-29T16:05:00Z').toISOString(), payload: { message: 'Great, thanks for the update.', author: 'Buyer' }},
        ],
    }
];

export const mockRfqMessages: RFQMessage[] = [
    {
        id: 'msg-1',
        rfqId: 'rfq-2',
        senderId: 'user-1', // Admin
        senderType: 'admin',
        message: 'Thanks for your request. We are currently looking for matching equipment. We have a few options in our network that might fit. I will get back to you with a concrete offer soon.',
        createdAt: new Date('2024-07-29T16:00:00Z').toISOString(),
    },
    {
        id: 'msg-2',
        rfqId: 'rfq-2',
        senderId: 'user-3', // Buyer
        senderType: 'buyer',
        message: 'Great, thanks for the update.',
        createdAt: new Date('2024-07-29T16:05:00Z').toISOString(),
    }
];

export const mockOffers: Offer[] = [
    {
        id: 'offer-1',
        rfqId: 'rfq-1',
        listingId: 'listing-2',
        title: 'Offer for 2019 Volvo FH 500',
        price: 95000,
        currency: 'EUR',
        terms: 'EXW Rotterdam',
        location: 'Rotterdam, Netherlands',
        availabilityText: 'Available immediately',
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 2 weeks from now
        includedFlags: {
            'Inspection': true,
            'Transport': false,
            'Customs': false,
        },
        notes: 'This vehicle is in excellent condition and matches your requirements. We can arrange transport for an additional fee.',
        status: 'Sent',
        createdAt: new Date('2024-07-30T09:00:00Z').toISOString(),
        sentAt: new Date('2024-07-30T09:05:00Z').toISOString(),
        versionNumber: 1,
    }
];
