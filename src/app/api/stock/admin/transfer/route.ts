import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Stock, { IShelterStock } from '@/lib/db/models/Stock';
import StockMovement from '@/lib/db/models/StockMovement';
import { stockTransferSchema } from '@/lib/validations';
import { errorTracker, createErrorResponse, formatValidationErrors } from '@/lib/error-tracker';
import { ZodError } from 'zod';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'ไม่ได้รับอนุญาต (Token missing)' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึง (Admin only)' }, { status: 403 });
    }

    const body = await request.json();

    // 1. ตรวจสอบข้อมูลนำเข้า
    const validatedData = stockTransferSchema.parse(body);

    await connectDB();

    // 2. ค้นหาสต๊อกสินค้าหลัก (Product Record)
    const stock = await Stock.findById(validatedData.stockId);

    if (!stock) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลสินค้าในระบบสต๊อก' }, { status: 404 });
    }

    const beforeStockSnap = stock.totalQuantity;
    let fromName = '';
    let toName = '';

    // 📌 จัดการฝั่ง "ต้นทาง"
    if (validatedData.fromShelterId === 'provincial') {
      // โอนจากกองกลางจังหวัด
      if (stock.provincialStock < validatedData.quantity) {
        return NextResponse.json({
          error: `สต๊อกกองกลางไม่เพียงพอ (มีอยู่ ${stock.provincialStock} ${stock.unit})`
        }, { status: 400 });
      }
      stock.provincialStock -= validatedData.quantity;
      fromName = 'กองกลางจังหวัด';
    } else {
      // โอนจากศูนย์พักพิง
      const fromShelterIndex = stock.shelterStock.findIndex(
        (s: IShelterStock) => s.shelterId.toString() === validatedData.fromShelterId
      );

      if (fromShelterIndex === -1 || stock.shelterStock[fromShelterIndex].quantity < validatedData.quantity) {
        const currentQty = fromShelterIndex === -1 ? 0 : stock.shelterStock[fromShelterIndex].quantity;
        return NextResponse.json({
          error: `สต๊อกที่ศูนย์ต้นทางไม่เพียงพอ (มีอยู่ ${currentQty} ${stock.unit})`
        }, { status: 400 });
      }
      stock.shelterStock[fromShelterIndex].quantity -= validatedData.quantity;
      stock.shelterStock[fromShelterIndex].lastUpdated = new Date();
      fromName = 'ศูนย์พักพิงต้นทาง';
    }

    // 📌 จัดการฝั่ง "ปลายทาง"
    if (validatedData.toShelterId === 'provincial') {
      // โอนเข้ากองกลางจังหวัด
      stock.provincialStock += validatedData.quantity;
      toName = 'กองกลางจังหวัด';
    } else {
      // โอนเข้าศูนย์พักพิง
      const toShelterIndex = stock.shelterStock.findIndex(
        (s: IShelterStock) => s.shelterId.toString() === validatedData.toShelterId
      );

      if (toShelterIndex !== -1) {
        stock.shelterStock[toShelterIndex].quantity += validatedData.quantity;
        stock.shelterStock[toShelterIndex].lastUpdated = new Date();
      } else {
        // หากยังไม่เคยมีสินค้าที่ศูนย์นี้ ให้สร้างรายการใหม่ใน Array
        stock.shelterStock.push({
          shelterId: new mongoose.Types.ObjectId(validatedData.toShelterId),
          quantity: validatedData.quantity,
          lastUpdated: new Date()
        });
      }
      toName = 'ศูนย์พักพิงปลายทาง';
    }

    // บันทึกการเปลี่ยนแปลง
    stock.calculateTotal(); // คำนวณยอดรวมใหม่
    await stock.save();

    // 3. สร้างบันทึกความเคลื่อนไหว (StockMovement)
    const movement = await StockMovement.create({
      stockId: stock._id,
      movementType: 'transfer',
      quantity: validatedData.quantity,
      unit: stock.unit,
      from: {
        type: validatedData.fromShelterId === 'provincial' ? 'provincial' : 'shelter',
        id: validatedData.fromShelterId === 'provincial' ? null : validatedData.fromShelterId,
        name: fromName
      },
      to: {
        type: validatedData.toShelterId === 'provincial' ? 'provincial' : 'shelter',
        id: validatedData.toShelterId === 'provincial' ? null : validatedData.toShelterId,
        name: toName
      },
      performedBy: decoded.userId,
      notes: validatedData.notes || 'โอนย้ายสต๊อกระหว่างศูนย์',
      snapshot: {
        before: beforeStockSnap,
        after: stock.totalQuantity
      },
      performedAt: new Date()
    });

    return NextResponse.json({
      success: true,
      message: `โอน ${stock.itemName} จำนวน ${validatedData.quantity} ${stock.unit} สำเร็จแล้ว ✅`,
      movement
    }, { status: 201 });

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลที่ส่งมาไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
        { status: 400 }
      );
    }

    errorTracker.logError(error, { endpoint: '/api/stock/admin/transfer', method: 'POST' });
    return NextResponse.json(
      createErrorResponse(error, 'เกิดข้อผิดพลาดภายในระบบ ไม่สามารถโอนสต๊อกได้'),
      { status: 500 }
    );
  }
}