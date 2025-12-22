import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongodb';
import Stock from '@/lib/db/models/Stock';
import { withStaffAuth } from '@/lib/auth/rbac';

export async function GET(req: NextRequest) {
    return withStaffAuth(req, async () => {
        try {
            await connectDB();

            // Get all provincial stock (stock where shelterRef is null)
            const provincialStock = await Stock.find({
                shelterRef: null
            }).select('itemName category provincialStock unit minStockLevel criticalLevel');

            return NextResponse.json({
                stock: provincialStock
            });

        } catch (error: unknown) {
            console.error('Error fetching provincial stock:', error);
            return NextResponse.json(
                { error: 'Internal server error' },
                { status: 500 }
            );
        }
    });
}
