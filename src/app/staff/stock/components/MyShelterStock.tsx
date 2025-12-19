
'use client';

import { useState, useEffect } from 'react';
import styles from './MyShelterStock.module.css';

interface StockItem {
  stockId: string;
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  status: 'sufficient' | 'low' | 'critical' | 'unavailable';
  lastUpdated: string | null;
  minStockLevel: number;
  criticalLevel: number;
}

interface MyShelterStockData {
  shelterId: string;
  shelterName: string;
  totalItems: number;
  stock: StockItem[];
}

export default function MyShelterStock() {
  const [data, setData] = useState<MyShelterStockData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/staff/my-shelter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>กำลังโหลด...</div>;
  if (error) return <div className={styles.error}>เกิดข้อผิดพลาด: {error}</div>;
  if (!data) return null;

  // กรองข้อมูล
  let filteredStock = data.stock;

  if (filterCategory !== 'all') {
    filteredStock = filteredStock.filter(s => s.category === filterCategory);
  }

  if (filterStatus !== 'all') {
    filteredStock = filteredStock.filter(s => s.status === filterStatus);
  }

  const categoryLabels: Record<string, string> = {
    food: 'อาหาร',
    medicine: 'ยา',
    clothing: 'เสื้อผ้า',
    other: 'อื่นๆ'
  };

  const statusLabels: Record<string, string> = {
    sufficient: 'เพียงพอ',
    low: 'ใกล้หมด',
    critical: 'วิกฤต'
  };

  const statusColors: Record<string, string> = {
    sufficient: styles.statusGreen,
    low: styles.statusYellow,
    critical: styles.statusRed
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2>สต๊อกสินค้าของศูนย์</h2>
          <p className={styles.shelterName}>{data.shelterName}</p>
        </div>
        <button onClick={fetchStock} className={styles.refreshBtn}>
          🔄 รีเฟรช
        </button>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>จำนวนรายการทั้งหมด</div>
          <div className={styles.summaryValue}>{data.totalItems}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>เพียงพอ</div>
          <div className={`${styles.summaryValue} ${styles.green}`}>
            {data.stock.filter(s => s.status === 'sufficient').length}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>ใกล้หมด</div>
          <div className={`${styles.summaryValue} ${styles.yellow}`}>
            {data.stock.filter(s => s.status === 'low').length}
          </div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.summaryLabel}>วิกฤต</div>
          <div className={`${styles.summaryValue} ${styles.red}`}>
            {data.stock.filter(s => s.status === 'critical').length}
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">หมวดทั้งหมด</option>
          <option value="food">อาหาร</option>
          <option value="medicine">ยา</option>
          <option value="clothing">เสื้อผ้า</option>
          <option value="other">อื่นๆ</option>
        </select>

        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">สถานะทั้งหมด</option>
          <option value="sufficient">เพียงพอ</option>
          <option value="low">ใกล้หมด</option>
          <option value="critical">วิกฤต</option>
        </select>
      </div>

      <div className={styles.stockList}>
        {filteredStock.length === 0 ? (
          <div className={styles.empty}>ไม่พบรายการสินค้า</div>
        ) : (
          filteredStock.map(item => (
            <div key={item.stockId} className={styles.stockItem}>
              <div className={styles.itemInfo}>
                <div className={styles.itemName}>{item.itemName}</div>
                <div className={styles.itemCategory}>
                  {categoryLabels[item.category]}
                </div>
              </div>
              <div className={styles.itemQuantity}>
                <span className={styles.quantity}>{item.quantity}</span>
                <span className={styles.unit}>{item.unit}</span>
              </div>
              <div className={`${styles.itemStatus} ${statusColors[item.status]}`}>
                {statusLabels[item.status]}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}