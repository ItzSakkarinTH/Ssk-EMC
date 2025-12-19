import { JWTPayload } from '@/lib/auth/rbac';

interface StockWithShelters {
  itemName: string;
  category: string;
  totalQuantity: number;
  unit: string;
  minStockLevel: number;
  criticalLevel: number;
  getStatus: () => string;
  shelterStock: Array<{
    shelterId: { toString: () => string };
    quantity: number;
    lastUpdated?: Date;
  }>;
}

interface Movement {
  from: { id?: { toString: () => string } };
  to: { id?: { toString: () => string } };
}

export class RBACFilter {

  // กรองข้อมูล Stock ตาม Role
  static filterStock(stock: StockWithShelters, user: JWTPayload | null) {
    if (!user) {
      // Public: เห็นแค่ข้อมูลพื้นฐาน
      return {
        itemName: stock.itemName,
        category: stock.category,
        totalQuantity: stock.totalQuantity,
        unit: stock.unit,
        status: stock.getStatus()
      };
    }

    if (user.role === 'admin') {
      // Admin: เห็นทุกอย่าง
      return stock;
    }

    if (user.role === 'staff' && user.assignedShelterId) {
      // Staff: เห็นเฉพาะศูนย์ตัวเอง
      const shelterStock = stock.shelterStock.find(
        (s) => s.shelterId.toString() === user.assignedShelterId
      );

      return {
        itemName: stock.itemName,
        category: stock.category,
        unit: stock.unit,
        quantity: shelterStock?.quantity || 0,
        lastUpdated: shelterStock?.lastUpdated,
        minStockLevel: stock.minStockLevel,
        criticalLevel: stock.criticalLevel,
        status: shelterStock
          ? (shelterStock.quantity <= stock.criticalLevel ? 'critical'
            : shelterStock.quantity <= stock.minStockLevel ? 'low'
              : 'sufficient')
          : 'unavailable'
      };
    }

    return null;
  }

  // กรองรายการ Movement
  static filterMovements(movements: Movement[], user: JWTPayload) {
    if (user.role === 'admin') {
      return movements;
    }

    if (user.role === 'staff' && user.assignedShelterId) {
      // Staff เห็นเฉพาะที่เกี่ยวข้องกับศูนย์ตัวเอง
      return movements.filter(m =>
        m.from.id?.toString() === user.assignedShelterId ||
        m.to.id?.toString() === user.assignedShelterId
      );
    }

    return [];
  }
}
