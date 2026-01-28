
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '12');
        const skip = (page - 1) * limit;

        // Filters
        const category = searchParams.get('category');
        const brand = searchParams.get('brand');
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const yearMin = searchParams.get('yearMin');
        const yearMax = searchParams.get('yearMax');
        const country = searchParams.get('country');
        const condition = searchParams.get('condition');

        // Build Prisma Where Clause
        const where: Prisma.ListingWhereInput = {
            visibility: 'PUBLIC',
            availabilityStatus: 'AVAILABLE',
        };

        if (category) {
            // Handle potential enum case sensitivity or mapping if needed
            // Assuming strict match for now based on Schema Enums
            where.category = category as any;
        }

        if (brand) {
            // Only apply brand filter if length is sufficient for trigram index usage
            if (brand.length >= 3) {
                where.brand = { contains: brand, mode: 'insensitive' };
            } else {
                // Return empty result if search term is too short
                // Using an impossible condition to return 0 results
                return NextResponse.json({
                    listings: [],
                    pagination: {
                        total: 0,
                        page,
                        limit,
                        totalPages: 0,
                    },
                });
            }
        }

        if (minPrice || maxPrice) {
            where.pricePerUnit = {};
            if (minPrice) where.pricePerUnit.gte = parseFloat(minPrice);
            if (maxPrice) where.pricePerUnit.lte = parseFloat(maxPrice);
        }

        if (yearMin || yearMax) {
            where.year = {};
            if (yearMin) where.year.gte = parseInt(yearMin);
            if (yearMax) where.year.lte = parseInt(yearMax);
        }

        if (country) {
            where.country = { equals: country, mode: 'insensitive' };
        }

        if (condition) {
            where.condition = condition as any;
        }

        // Execute Query
        const [listings, total] = await Promise.all([
            db.listing.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    media: {
                        orderBy: { sortOrder: 'asc' },
                        take: 1, // Cover image only for list view
                    },
                    specs: true,
                },
            }),
            db.listing.count({ where }),
        ]);

        // Transform for client (if needed)
        // Currently Prisma JSON output is compatible with frontend types mostly, 
        // but dates are Strings in JSON.

        return NextResponse.json({
            listings,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Failed to fetch listings:', error);
        return NextResponse.json({ message: 'Failed to fetch listings' }, { status: 500 });
    }
}
