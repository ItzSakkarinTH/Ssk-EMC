import Stock from '@/lib/db/models/Stock';

export class StockValidator {
  
  // ตรวจสอบว่ามีสต๊อกเพียงพอหรือไม่
  static async validateDispense(
    stockId: string,
    shelterId: string,
    quantity: number
  ): Promise<{ valid: boolean; error?: string; available?: number }> {
    
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return { valid: false, error: 'Stock not found' };
    }

    const shelterStock = stock.getShelterStock(shelterId);
    if (!shelterStock) {
      return { valid: false, error: 'Shelter stock not found' };
    }

    if (shelterStock.quantity < quantity) {
      return {
        valid: false,
        error: 'Insufficient stock',
        available: shelterStock.quantity
      };
    }

    return { valid: true };
  }

  // ตรวจสอบการโอน
  static async validateTransfer(
    stockId: string,
    fromShelterId: string | 'provincial',
    quantity: number
  ): Promise<{ valid: boolean; error?: string; available?: number }> {
    
    const stock = await Stock.findById(stockId);
    if (!stock) {
      return { valid: false, error: 'Stock not found' };
    }

    if (fromShelterId === 'provincial') {
      if (stock.provincialStock < quantity) {
        return {
          valid: false,
          error: 'Insufficient provincial stock',
          available: stock.provincialStock
        };
      }
    } else {
      const shelterStock = stock.getShelterStock(fromShelterId);
      if (!shelterStock) {
        return { valid: false, error: 'Source shelter stock not found' };
      }

      if (shelterStock.quantity < quantity) {
        return {
          valid: false,
          error: 'Insufficient shelter stock',
          available: shelterStock.quantity
        };
      }
    }

    return { valid: true };
  }

  // ตรวจสอบค่าที่ป้อนเข้ามา
  static validateInput(data: {
    quantity?: number;
    stockId?: string;
    shelterId?: string;
  }): { valid: boolean; errors: string[] } {
    
    const errors: string[] = [];

    if (data.quantity !== undefined) {
      if (data.quantity <= 0) {
        errors.push('Quantity must be positive');
      }
      if (!Number.isFinite(data.quantity)) {
        errors.push('Quantity must be a number');
      }
    }

    if (data.stockId !== undefined && !data.stockId.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push('Invalid stock ID format');
    }

    if (data.shelterId !== undefined && 
        data.shelterId !== 'provincial' && 
        !data.shelterId.match(/^[0-9a-fA-F]{24}$/)) {
      errors.push('Invalid shelter ID format');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}