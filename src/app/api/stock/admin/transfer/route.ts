import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { connectDB } from '@/lib/db/mongodb';
import Stock from '@/lib/db/models/Stock';
import StockMovement from '@/lib/db/models/StockMovement';
import { stockTransferSchema } from '@/lib/validations';
import { errorTracker, createErrorResponse, formatValidationErrors } from '@/lib/error-tracker';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    // Validate input
    const validatedData = stockTransferSchema.parse(body);

    await connectDB();

    // Find source stock
    const sourceStock = await Stock.findOne({
      _id: validatedData.stockId,
      shelterId: validatedData.fromShelterId === 'provincial' ? null : validatedData.fromShelterId
    });

    if (!sourceStock) {
      return NextResponse.json(
        { error: 'ไม่พบสต๊อกต้นทาง' },
        { status: 404 }
      );
    }

    // Check if enough quantity available
    if (sourceStock.currentQuantity < validatedData.quantity) {
      return NextResponse.json(
        { error: `สต๊อกไม่เพียงพอ (มีอยู่ ${sourceStock.currentQuantity} ${sourceStock.unit})` },
        { status: 400 }
      );
    }

    // Find or create destination stock
    let destStock = await Stock.findOne({
      itemId: sourceStock.itemId,
      shelterId: validatedData.toShelterId === 'provincial' ? null : validatedData.toShelterId
    });

    const beforeSource = sourceStock.currentQuantity;

    // Update source stock
    sourceStock.currentQuantity -= validatedData.quantity;
    await sourceStock.save();

    // Update or create destination stock
    if (destStock) {
      destStock.currentQuantity += validatedData.quantity;
      await destStock.save();
    } else {
      destStock = await Stock.create({
        itemId: sourceStock.itemId,
        shelterId: validatedData.toShelterId === 'provincial' ? null : validatedData.toShelterId,
        currentQuantity: validatedData.quantity,
        unit: sourceStock.unit,
        minThreshold: sourceStock.minThreshold,
        maxCapacity: sourceStock.maxCapacity
      });
    }

    // Create movement log
    const movement = await StockMovement.create({
      stockId: sourceStock._id,
      movementType: 'transfer',
      quantity: validatedData.quantity,
      unit: sourceStock.unit,
      from: {
        type: validatedData.fromShelterId === 'provincial' ? 'provincial' : 'shelter',
        id: validatedData.fromShelterId === 'provincial' ? null : validatedData.fromShelterId,
        name: validatedData.fromShelterId === 'provincial' ? 'กองกลางจังหวัด' : 'ศูนย์พักพิง'
      },
      to: {
        type: validatedData.toShelterId === 'provincial' ? 'provincial' : 'shelter',
        id: validatedData.toShelterId === 'provincial' ? null : validatedData.toShelterId,
        name: validatedData.toShelterId === 'provincial' ? 'กองกลางจังหวัด' : 'ศูนย์พักพิง'
      },
      performedBy: decoded.userId,
      notes: validatedData.notes || '',
      snapshot: {
        before: beforeSource,
        after: sourceStock.currentQuantity
      }
    });

    errorTracker.logInfo('Stock transferred successfully', {
      movementId: movement._id,
      stockId: sourceStock._id,
      quantity: validatedData.quantity,
      from: validatedData.fromShelterId,
      to: validatedData.toShelterId,
      userId: decoded.userId
    });

    return NextResponse.json({
      success: true,
      movement,
      message: 'โอนสต๊อกสำเร็จ'
    }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ถูกต้อง', details: formatValidationErrors(error.issues) },
        { status: 400 }
      );
    }

    errorTracker.logError(error, { endpoint: '/api/stock/admin/transfer', method: 'POST' });
    return NextResponse.json(
      createErrorResponse(error, 'ไม่สามารถโอนสต๊อกได้'),
      { status: 500 }
    );
  }
}