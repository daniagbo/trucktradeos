import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Seeding database...");

    // Clear existing data
    await prisma.auditLog.deleteMany();
    await prisma.rFQEvent.deleteMany();
    await prisma.rFQMessage.deleteMany();
    await prisma.offer.deleteMany();
    await prisma.rFQ.deleteMany();
    await prisma.internalNote.deleteMany();
    await prisma.document.deleteMany();
    await prisma.spec.deleteMany();
    await prisma.media.deleteMany();
    await prisma.listing.deleteMany();
    await prisma.user.deleteMany();

    // Create users
    const passwordHash = await bcrypt.hash("password123", 10);

    const admin = await prisma.user.create({
        data: {
            email: "admin@marketplace.com",
            passwordHash,
            role: "ADMIN",
            accountType: "COMPANY",
            name: "Admin User",
            phone: "123-456-7890",
            country: "Netherlands",
            companyName: "Marketplace Inc.",
            vat: "NL123456789B01",
        },
    });
    console.log(`✅ Created admin: ${admin.email}`);

    const member = await prisma.user.create({
        data: {
            email: "member@marketplace.com",
            passwordHash,
            role: "MEMBER",
            accountType: "COMPANY",
            name: "Member User",
            phone: "098-765-4321",
            country: "Germany",
            companyName: "Transport GmbH",
            vat: "DE987654321",
        },
    });
    console.log(`✅ Created member: ${member.email}`);

    // Create listings
    const listing1 = await prisma.listing.create({
        data: {
            title: "2022 Scania R 450",
            category: "TRUCK",
            brand: "Scania",
            model: "R 450",
            year: 2022,
            condition: "EXCELLENT",
            country: "Germany",
            city: "Berlin",
            description:
                "Almost new Scania R 450 with low mileage. Used for light-duty transport within the city. Maintained by certified mechanics.",
            visibility: "PUBLIC",
            verificationStatus: "VERIFIED",
            availabilityStatus: "AVAILABLE",
            creatorId: admin.id,
            media: {
                create: [
                    {
                        url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800",
                        imageHint: "scania truck",
                        sortOrder: 1,
                    },
                ],
            },
            specs: {
                create: [
                    { key: "Mileage", value: "50,000 km" },
                    { key: "Engine", value: "DC13 156" },
                    { key: "Power", value: "450 HP" },
                    { key: "Gearbox", value: "Opticruise" },
                ],
            },
        },
    });
    console.log(`✅ Created listing: ${listing1.title}`);

    const listing2 = await prisma.listing.create({
        data: {
            title: "2019 Volvo FH 500",
            category: "TRUCK",
            brand: "Volvo",
            model: "FH 500",
            year: 2019,
            condition: "GOOD",
            country: "Netherlands",
            city: "Rotterdam",
            description:
                "Well-maintained Volvo FH 500, single owner, used for long-haul routes across Europe.",
            visibility: "PUBLIC",
            verificationStatus: "PENDING",
            availabilityStatus: "EXPECTED",
            creatorId: admin.id,
            media: {
                create: [
                    {
                        url: "https://images.unsplash.com/photo-1586191582056-aef29c78c233?w=800",
                        imageHint: "volvo truck",
                        sortOrder: 1,
                    },
                ],
            },
            specs: {
                create: [
                    { key: "Mileage", value: "320,000 km" },
                    { key: "Engine", value: "D13K500" },
                    { key: "Power", value: "500 HP" },
                    { key: "Cabin", value: "Globetrotter XL" },
                ],
            },
        },
    });
    console.log(`✅ Created listing: ${listing2.title}`);

    const listing3 = await prisma.listing.create({
        data: {
            title: "Komatsu PC210 Excavator",
            category: "HEAVY_EQUIPMENT",
            brand: "Komatsu",
            model: "PC210",
            year: 2020,
            condition: "GOOD",
            country: "USA",
            city: "Houston, TX",
            description:
                "Komatsu PC210 excavator with standard bucket. Used in residential construction projects.",
            visibility: "PUBLIC",
            verificationStatus: "UNVERIFIED",
            availabilityStatus: "AVAILABLE",
            creatorId: admin.id,
            media: {
                create: [
                    {
                        url: "https://images.unsplash.com/photo-1580901368919-7738efb0f87e?w=800",
                        imageHint: "excavator",
                        sortOrder: 1,
                    },
                ],
            },
            specs: {
                create: [
                    { key: "Hours", value: "2,500" },
                    { key: "Weight", value: "22 tons" },
                ],
            },
        },
    });
    console.log(`✅ Created listing: ${listing3.title}`);

    // Create an RFQ
    const rfq = await prisma.rFQ.create({
        data: {
            userId: member.id,
            listingId: listing1.id,
            status: "RECEIVED",
            category: "TRUCK",
            brand: "Scania",
            requirements: "Looking for a reliable Scania R 450 for our fleet expansion.",
            quantity: 2,
            budget: "€50,000 - €80,000",
            urgency: "Within 30 days",
        },
    });
    console.log(`✅ Created RFQ: ${rfq.id}`);

    console.log("✨ Seeding complete!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
