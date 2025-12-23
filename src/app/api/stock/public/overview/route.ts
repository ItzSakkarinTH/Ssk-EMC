
import { NextResponse } from 'next/server';
import Stock from '@/lib/db/models/Stock';
import Shelter from '@/lib/db/models/Shelter';
import dbConnect from '@/lib/db/mongodb';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();

    // ดึงข้อมูลสรุปทั้งหมด
    const allStocks = await Stock.find({});

    const totalItems = allStocks.length;
    const totalQuantity = allStocks.reduce((sum: number, s: { totalQuantity: number }) => sum + s.totalQuantity, 0);
    const totalReceived = allStocks.reduce((sum: number, s: { totalReceived: number }) => sum + s.totalReceived, 0);
    const totalDispensed = allStocks.reduce((sum: number, s: { totalDispensed: number }) => sum + s.totalDispensed, 0);

    // ดึงข้อมูลศูนย์พักพิง
    const allShelters = await Shelter.find({});
    const totalShelters = allShelters.length;
    const activeShelters = allShelters.filter((s: { status: string }) => s.status === 'active').length;
    const inactiveShelters = allShelters.filter((s: { status: string }) => s.status === 'inactive').length;
    const fullShelters = allShelters.filter((s: { status: string }) => s.status === 'full').length;

    // แยกตามหมวด รวมถึงแยกน้ำดื่มออกจากอาหาร พร้อมข้อมูลระดับวิกฤติ
    interface CategoryData {
      items: number;
      quantity: number;
      minLevel: number;
      criticalLevel: number;
      status?: 'sufficient' | 'low' | 'critical';
    }

    const byCategory: Record<string, CategoryData> = {
      water: { items: 0, quantity: 0, minLevel: 0, criticalLevel: 0 },    // น้ำดื่ม
      food: { items: 0, quantity: 0, minLevel: 0, criticalLevel: 0 },     // อาหาร
      medicine: { items: 0, quantity: 0, minLevel: 0, criticalLevel: 0 }, // ยา
      bedding: { items: 0, quantity: 0, minLevel: 0, criticalLevel: 0 },  // เครื่องนอน (ที่นอน/ผ้าห่ม)
      clothing: { items: 0, quantity: 0, minLevel: 0, criticalLevel: 0 }, // เสื้อผ้าทั่วไป
      other: { items: 0, quantity: 0, minLevel: 0, criticalLevel: 0 }     // อื่นๆ
    };

    allStocks.forEach((stock: { category: 'food' | 'medicine' | 'clothing' | 'other'; itemName: string; totalQuantity: number; minStockLevel: number; criticalLevel: number }) => {
      const name = stock.itemName.toLowerCase();

      // 1. แยกน้ำดื่มออกจาก food
      if (stock.category === 'food' && name.includes('น้ำ')) {
        byCategory.water.items++;
        byCategory.water.quantity += stock.totalQuantity;
        byCategory.water.minLevel += stock.minStockLevel;
        byCategory.water.criticalLevel += stock.criticalLevel;
      }
      // 2. แยกเครื่องนอน (ที่นอน, ผ้าห่ม, หมอน, มุ้ง) ออกมาเป็นหมวดเฉพาะ
      else if (name.includes('ที่นอน') || name.includes('ผ้าห่ม') || name.includes('หมอน') || name.includes('มุ้ง')) {
        byCategory.bedding.items++;
        byCategory.bedding.quantity += stock.totalQuantity;
        byCategory.bedding.minLevel += stock.minStockLevel;
        byCategory.bedding.criticalLevel += stock.criticalLevel;
      }
      // 3. จัดเข้าหมวดปกติที่เหลือ
      else {
        byCategory[stock.category].items++;
        byCategory[stock.category].quantity += stock.totalQuantity;
        byCategory[stock.category].minLevel += stock.minStockLevel;
        byCategory[stock.category].criticalLevel += stock.criticalLevel;
      }
    });

    // คำนวณ status ของแต่ละหมวดหมู่ตามเกณฑ์ปริมาณ
    // แดง (critical): < 50, ส้ม (low): < 200, เขียว (sufficient): >= 200
    Object.keys(byCategory).forEach((key) => {
      const cat = byCategory[key];
      if (cat.quantity < 50) {
        cat.status = 'critical';
      } else if (cat.quantity < 200) {
        cat.status = 'low';
      } else {
        cat.status = 'sufficient';
      }
    });

    // นับแจ้งเตือน
    let lowStock = 0;
    let outOfStock = 0;

    allStocks.forEach((stock: { getStatus: () => string }) => {
      const status = stock.getStatus();
      if (status === 'low' || status === 'critical') lowStock++;
      if (status === 'outOfStock') outOfStock++;
    });

    // คำนวณสถานะของแต่ละศูนย์ (วิกฤติ vs เฝ้าระวัง)
    const shelterStatusMap = new Map<string, 'crisis' | 'warning'>();

    allStocks.forEach((stock: { shelterStock?: { shelterId: mongoose.Types.ObjectId; quantity: number }[] }) => {
      if (stock.shelterStock && Array.isArray(stock.shelterStock)) {
        stock.shelterStock.forEach((ss: { shelterId: mongoose.Types.ObjectId; quantity: number }) => {
          const shelterId = ss.shelterId.toString();
          const currentStatus = shelterStatusMap.get(shelterId);

          if (ss.quantity < 50) {
            // ถ้ามีของชิ้นไหน < 50 ให้เป็นวิกฤติทันที (สำคัญที่สุด)
            shelterStatusMap.set(shelterId, 'crisis');
          } else if (ss.quantity < 200 && currentStatus !== 'crisis') {
            // ถ้ามีของ < 200 และยังไม่ถูกจัดเป็นวิกฤติ ให้เป็นเฝ้าระวัง
            shelterStatusMap.set(shelterId, 'warning');
          }
        });
      }
    });

    const crisisCount = Array.from(shelterStatusMap.values()).filter(v => v === 'crisis').length;
    const warningCount = Array.from(shelterStatusMap.values()).filter(v => v === 'warning').length;

    return NextResponse.json({
      totalItems,
      totalQuantity,
      totalReceived,
      totalDispensed,
      byCategory,
      alerts: {
        lowStock,
        outOfStock
      },
      shelters: {
        total: totalShelters,
        active: activeShelters,
        inactive: inactiveShelters,
        full: fullShelters,
        crisis: crisisCount,
        warning: warningCount
      },
      lastUpdated: new Date()
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Public overview error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch stock overview' },
      { status: 500 }
    );
  }
}