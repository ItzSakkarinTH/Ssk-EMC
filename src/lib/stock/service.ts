
import Stock from '@/lib/db/models/Stock';
import StockMovement from '@/lib/db/models/StockMovement';
import mongoose from 'mongoose';

export class StockService {

  // ฟังก์ชันรับเข้าสต๊อก (Provincial หรือ Shelter)
  static async receiveStock(data: {
    stockId: string;
    quantity: number;
    destination: 'provincial' | 'shelter';
    shelterId?: string;
    userId: string;
    from: string;
    referenceId?: string;
    notes?: string;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stock = await Stock.findById(data.stockId).session(session);
      if (!stock) throw new Error('Stock not found');

      const beforeQty = data.destination === 'provincial'
        ? stock.provincialStock
        : stock.getShelterStock(data.shelterId!)?.quantity || 0;

      // เพิ่มสต๊อก
      if (data.destination === 'provincial') {
        stock.provincialStock += data.quantity;
      } else if (data.shelterId) {
        const shelterStock = stock.shelterStock.find(
          (s: { shelterId: { toString: () => string } }) => s.shelterId.toString() === data.shelterId
        );

        if (shelterStock) {
          shelterStock.quantity += data.quantity;
          shelterStock.lastUpdated = new Date();
        } else {
          stock.shelterStock.push({
            shelterId: new mongoose.Types.ObjectId(data.shelterId),
            quantity: data.quantity,
            lastUpdated: new Date()
          });
        }
      }

      stock.totalReceived += data.quantity;
      stock.calculateTotal();
      stock.metadata.updatedAt = new Date();
      await stock.save({ session });

      const afterQty = beforeQty + data.quantity;

      // บันทึก Movement
      await StockMovement.create([{
        stockId: data.stockId,
        movementType: 'receive',
        quantity: data.quantity,
        unit: stock.unit,
        from: {
          type: 'external',
          id: null,
          name: data.from
        },
        to: {
          type: data.destination,
          id: data.shelterId ? new mongoose.Types.ObjectId(data.shelterId) : null,
          name: data.destination === 'provincial' ? 'Provincial Stock' : 'Shelter'
        },
        performedBy: new mongoose.Types.ObjectId(data.userId),
        referenceId: data.referenceId,
        notes: data.notes,
        snapshot: { before: beforeQty, after: afterQty }
      }], { session });

      await session.commitTransaction();
      return { success: true, newQuantity: afterQty };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ฟังก์ชันเบิกจ่าย (จากศูนย์ไปผู้รับ)
  static async dispenseStock(data: {
    stockId: string;
    shelterId: string;
    quantity: number;
    userId: string;
    recipient: string;
    notes?: string;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stock = await Stock.findById(data.stockId).session(session);
      if (!stock) throw new Error('Stock not found');

      const shelterStock = stock.getShelterStock(data.shelterId);
      if (!shelterStock) throw new Error('Shelter stock not found');
      if (shelterStock.quantity < data.quantity) {
        throw new Error('Insufficient stock');
      }

      const beforeQty = shelterStock.quantity;

      // ตัดสต๊อก
      shelterStock.quantity -= data.quantity;
      shelterStock.lastUpdated = new Date();
      stock.totalDispensed += data.quantity;
      stock.calculateTotal();
      stock.metadata.updatedAt = new Date();
      await stock.save({ session });

      const afterQty = shelterStock.quantity;

      // บันทึก Movement
      await StockMovement.create([{
        stockId: data.stockId,
        movementType: 'dispense',
        quantity: data.quantity,
        unit: stock.unit,
        from: {
          type: 'shelter',
          id: new mongoose.Types.ObjectId(data.shelterId),
          name: 'Shelter'
        },
        to: {
          type: 'beneficiary',
          id: null,
          name: data.recipient
        },
        performedBy: new mongoose.Types.ObjectId(data.userId),
        notes: data.notes,
        snapshot: { before: beforeQty, after: afterQty }
      }], { session });

      await session.commitTransaction();

      return {
        success: true,
        remainingStock: afterQty,
        alert: afterQty <= stock.minStockLevel
      };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ฟังก์ชันโอนระหว่างศูนย์
  static async transferStock(data: {
    stockId: string;
    fromShelterId: string | 'provincial';
    toShelterId: string;
    quantity: number;
    userId: string;
    notes?: string;
  }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const stock = await Stock.findById(data.stockId).session(session);
      if (!stock) throw new Error('Stock not found');

      let beforeFrom = 0;
      let beforeTo = 0;

      // ตัดสต๊อกต้นทาง
      if (data.fromShelterId === 'provincial') {
        if (stock.provincialStock < data.quantity) {
          throw new Error('Insufficient provincial stock');
        }
        beforeFrom = stock.provincialStock;
        stock.provincialStock -= data.quantity;
      } else {
        const fromShelter = stock.getShelterStock(data.fromShelterId);
        if (!fromShelter || fromShelter.quantity < data.quantity) {
          throw new Error('Insufficient shelter stock');
        }
        beforeFrom = fromShelter.quantity;
        fromShelter.quantity -= data.quantity;
        fromShelter.lastUpdated = new Date();
      }

      // เพิ่มสต๊อกปลายทาง
      const toShelter = stock.getShelterStock(data.toShelterId);
      if (toShelter) {
        beforeTo = toShelter.quantity;
        toShelter.quantity += data.quantity;
        toShelter.lastUpdated = new Date();
      } else {
        stock.shelterStock.push({
          shelterId: new mongoose.Types.ObjectId(data.toShelterId),
          quantity: data.quantity,
          lastUpdated: new Date()
        });
      }

      stock.calculateTotal();
      stock.metadata.updatedAt = new Date();
      await stock.save({ session });

      // บันทึก Movement
      await StockMovement.create([{
        stockId: data.stockId,
        movementType: 'transfer',
        quantity: data.quantity,
        unit: stock.unit,
        from: {
          type: data.fromShelterId === 'provincial' ? 'provincial' : 'shelter',
          id: data.fromShelterId === 'provincial'
            ? null
            : new mongoose.Types.ObjectId(data.fromShelterId),
          name: data.fromShelterId === 'provincial' ? 'Provincial' : 'Shelter'
        },
        to: {
          type: 'shelter',
          id: new mongoose.Types.ObjectId(data.toShelterId),
          name: 'Shelter'
        },
        performedBy: new mongoose.Types.ObjectId(data.userId),
        notes: data.notes,
        snapshot: { before: beforeFrom, after: beforeFrom - data.quantity }
      }], { session });

      await session.commitTransaction();
      return { success: true };

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // ตรวจสอบสต๊อกใกล้หมด
  static async checkLowStock() {
    const lowStockItems = await Stock.find({
      $expr: { $lte: ['$totalQuantity', '$minStockLevel'] }
    }).select('itemName category totalQuantity minStockLevel criticalLevel');

    return lowStockItems.map(item => ({
      itemName: item.itemName,
      category: item.category,
      currentStock: item.totalQuantity,
      minLevel: item.minStockLevel,
      status: item.getStatus()
    }));
  }
}