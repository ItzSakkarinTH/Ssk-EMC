import Stock from '@/lib/db/models/Stock';

export class StockCalculator {

  // คำนวณสต๊อกรวมทั้งหมด
  static async calculateTotalStock() {
    const stocks = await Stock.find({});

    return {
      totalItems: stocks.length,
      totalQuantity: stocks.reduce((sum, s) => sum + s.totalQuantity, 0),
      provincialStock: stocks.reduce((sum, s) => sum + s.provincialStock, 0),
      shelterStock: stocks.reduce((sum, s) =>
        sum + s.shelterStock.reduce((ss, sh) => ss + sh.quantity, 0), 0
      )
    };
  }

  // คำนวณสต๊อกตามหมวด
  static async calculateByCategory() {
    const stocks = await Stock.find({});

    const result: Record<string, { items: number; quantity: number }> = {
      food: { items: 0, quantity: 0 },
      medicine: { items: 0, quantity: 0 },
      clothing: { items: 0, quantity: 0 },
      other: { items: 0, quantity: 0 }
    };

    stocks.forEach(stock => {
      result[stock.category].items++;
      result[stock.category].quantity += stock.totalQuantity;
    });

    return result;
  }

  // คำนวณค่าเฉลี่ยวันที่สต๊อกอยู่ในคลัง
  static calculateAverageDaysInStock(
    totalReceived: number,
    totalDispensed: number,
    currentStock: number
  ): number {
    if (totalDispensed === 0) return 0;
    const turnoverRate = totalDispensed / ((totalReceived + currentStock) / 2);
    return 365 / turnoverRate;
  }
}
