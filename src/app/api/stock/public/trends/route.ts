import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import StockMovement from '@/lib/db/models/StockMovement';

export async function GET() {
    try {
        await dbConnect();

        // คำนวณวันที่ย้อนหลัง 7 วัน (native Date)
        const now = new Date();
        const end = new Date(now.setHours(23, 59, 59, 999));
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);

        // ดึงข้อมูลการจ่ายของ (dispense) ในช่วง 7 วัน
        const movements = await StockMovement.find({
            movementType: 'dispense',
            performedAt: {
                $gte: start,
                $lte: end
            }
        }).populate('stockId', 'category');

        // เตรียมวันทั้ง 7 สำหรับแกน X (รูปแบบ DD MMM)
        const days: string[] = [];
        const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(`${d.getDate()} ${thaiMonths[d.getMonth()]}`);
        }

        // เตรียมโครงสร้างข้อมูลสำหรับแต่ละหมวดหมู่
        const trends: Record<string, number[]> = {
            water: new Array(7).fill(0),
            food: new Array(7).fill(0),
            medicine: new Array(7).fill(0),
            bedding: new Array(7).fill(0),
        };

        // คำนวณสรุปยอดรายวัน
        movements.forEach(m => {
            const d = new Date(m.performedAt);
            const moveDate = `${d.getDate()} ${thaiMonths[d.getMonth()]}`;
            const dayIndex = days.indexOf(moveDate);

            if (dayIndex !== -1) {
                let category = 'other';
                const stock = m.stockId as any;
                const name = (m.itemName || '').toLowerCase();

                // ตรรกะแยกหมวดหมู่
                if (name.includes('น้ำ')) category = 'water';
                else if (name.includes('ที่นอน') || name.includes('ผ้าห่ม') || name.includes('หมอน') || name.includes('มุ้ง')) category = 'bedding';
                else if (stock?.category) category = stock.category;

                if (trends[category]) {
                    trends[category][dayIndex] += m.quantity;
                }
            }
        });

        return NextResponse.json({
            labels: days,
            data: trends
        });

    } catch (error) {
        console.error('Trend API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch trends' }, { status: 500 });
    }
}
