// @ts-nocheck
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COUNTRIES = ['Germany', 'France', 'USA', 'Netherlands', 'Spain', 'Italy', 'Poland', 'Belgium', 'Austria', 'Switzerland'];

function getRandomElement<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedListings(count: number) {
    console.log(`Seeding ${count} listings...`);
    const batchSize = 1000;
    const batches = Math.ceil(count / batchSize);

    // We need a valid user ID for creatorId.
    const user = await prisma.user.findFirst();
    if (!user) {
        throw new Error("No user found in DB. Please run 'npm run db:seed' first.");
    }

    for (let i = 0; i < batches; i++) {
        const data = [];
        for (let j = 0; j < batchSize; j++) {
            if (i * batchSize + j >= count) break;

            data.push({
                title: `Benchmark Listing ${i}-${j}`,
                category: 'TRUCK',
                brand: 'BenchmarkBrand',
                model: 'Model X',
                year: 2020,
                condition: 'USED',
                country: getRandomElement(COUNTRIES),
                city: 'Test City',
                description: 'Benchmark description',
                visibility: 'PUBLIC',
                availabilityStatus: 'AVAILABLE',
                creatorId: user.id,
                pricePerUnit: 10000 + Math.floor(Math.random() * 50000),
                quantity: 1,
            });
        }
        await prisma.listing.createMany({ data });
        console.log(`Seeded batch ${i + 1}/${batches}`);
    }
    console.log("Seeding complete.");
}

async function benchmark() {
    try {
        const existingCount = await prisma.listing.count();
        console.log(`Current listing count: ${existingCount}`);

        if (existingCount < 10000) {
            await seedListings(10000 - existingCount);
        }

        const iterations = 50;
        const searchCountry = 'Germany';

        // Warmup
        await prisma.$queryRaw`SELECT * FROM listings WHERE lower(country) = lower(${searchCountry})`;
        await prisma.$queryRaw`SELECT * FROM listings WHERE country = ${searchCountry}`;

        // 1. Benchmark Insensitive (Simulated)
        console.log("\n--- Benchmarking Insensitive Search (Simulated) ---");
        let totalTimeInsensitive = 0;
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await prisma.$queryRaw`SELECT * FROM listings WHERE lower(country) = lower(${searchCountry})`;
            const end = performance.now();
            totalTimeInsensitive += (end - start);
        }
        const avgInsensitive = totalTimeInsensitive / iterations;
        console.log(`\nAverage time (Insensitive): ${avgInsensitive.toFixed(4)} ms`);


        // 2. Benchmark Exact (Optimized)
        console.log("\n--- Benchmarking Exact Search (Optimized) ---");
        let totalTimeExact = 0;
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await prisma.$queryRaw`SELECT * FROM listings WHERE country = ${searchCountry}`;
            const end = performance.now();
            totalTimeExact += (end - start);
        }
        const avgExact = totalTimeExact / iterations;
        console.log(`\nAverage time (Exact): ${avgExact.toFixed(4)} ms`);

        console.log(`\nImprovement: ${((avgInsensitive - avgExact) / avgInsensitive * 100).toFixed(2)}%`);
        console.log(`Speedup: ${(avgInsensitive / avgExact).toFixed(2)}x`);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

benchmark();
