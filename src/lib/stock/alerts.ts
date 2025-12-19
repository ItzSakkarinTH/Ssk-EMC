import Stock from '@/lib/db/models/Stock';

export interface StockAlert {
  stockId: string;
  itemName: string;
  category: string;
  currentStock: number;
  minLevel: number;
  criticalLevel: number;
  status: 'low' | 'critical' | 'outOfStock';
  shelterId?: string;
}

export class StockAlerts {

  // ตรวจสอบสต๊อกทั้งหมด
  static async checkAllStock(): Promise<StockAlert[]> {
    const stocks = await Stock.find({});
    const alerts: StockAlert[] = [];

    stocks.forEach((stock: { _id: { toString: () => string }; getStatus: () => string; itemName: string; category: string; totalQuantity: number; minStockLevel: number; criticalLevel: number }) => {
      const status = stock.getStatus();

      if (status !== 'sufficient') {
        alerts.push({
          stockId: stock._id.toString(),
          itemName: stock.itemName,
          category: stock.category,
          currentStock: stock.totalQuantity,
          minLevel: stock.minStockLevel,
          criticalLevel: stock.criticalLevel,
          status: status as 'low' | 'critical' | 'outOfStock'
        });
      }
    });

    return alerts.sort((a, b) => {
      if (a.status === 'outOfStock') return -1;
      if (b.status === 'outOfStock') return 1;
      if (a.status === 'critical') return -1;
      if (b.status === 'critical') return 1;
      return 0;
    });
  }

  // ตรวจสอบสต๊อกของศูนย์เฉพาะ
  static async checkShelterStock(shelterId: string): Promise<StockAlert[]> {
    const stocks = await Stock.find({
      'shelterStock.shelterId': shelterId
    });

    const alerts: StockAlert[] = [];

    stocks.forEach((stock: { _id: { toString: () => string }; getShelterStock: (id: string) => { quantity: number } | undefined; itemName: string; category: string; minStockLevel: number; criticalLevel: number }) => {
      const shelterStock = stock.getShelterStock(shelterId);
      if (!shelterStock) return;

      let status: 'low' | 'critical' | 'outOfStock' | null = null;

      if (shelterStock.quantity === 0) {
        status = 'outOfStock';
      } else if (shelterStock.quantity <= stock.criticalLevel) {
        status = 'critical';
      } else if (shelterStock.quantity <= stock.minStockLevel) {
        status = 'low';
      }

      if (status) {
        alerts.push({
          stockId: stock._id.toString(),
          itemName: stock.itemName,
          category: stock.category,
          currentStock: shelterStock.quantity,
          minLevel: stock.minStockLevel,
          criticalLevel: stock.criticalLevel,
          status,
          shelterId
        });
      }
    });

    return alerts;
  }
}