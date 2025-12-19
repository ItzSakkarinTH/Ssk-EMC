// src/app/(public)/stock-dashboard/components/StockOverview.tsx
'use client';

import { useState, useEffect } from 'react';
import styles from './StockOverview.module.css';

interface StockOverviewData {
  totalItems: number;
  totalQuantity: number;
  totalReceived: number;
  totalDispensed: number;
  byCategory: {
    food: { items: number; quantity: number };
    medicine: { items: number; quantity: number };
    clothing: { items: number; quantity: number };
    other: { items: number; quantity: number };
  };
  alerts: {
    lowStock: number;
    outOfStock: number;
  };
  lastUpdated: string;
}

export default function StockOverview() {
  const [data, setData] = useState<StockOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 30000); // รีเฟรชทุก 30 วินาที
    return () => clearInterval(interval);
  }, []);

  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/stock/public/overview');
      if (!res.ok) throw new Error('Failed to fetch');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className={styles.loading}>กำลังโหลด...</div>;
  if (error) return <div className={styles.error}>เกิดข้อผิดพลาด: {error}</div>;
  if (!data) return null;

  const categoryLabels: Record<string, string> = {
    food: 'อาหาร',
    medicine: 'ยา',
    clothing: 'เสื้อผ้า',
    other: 'อื่นๆ'
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>สต๊อกสินค้าภาพรวม</h1>
        <p className={styles.lastUpdate}>
          อัปเดตล่าสุด: {new Date(data.lastUpdated).toLocaleString('th-TH')}
        </p>
      </div>

      {/* สรุปตัวเลข */}
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>จำนวนรายการทั้งหมด</div>
          <div className={styles.cardValue}>{data.totalItems}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>สต๊อกคงเหลือ</div>
          <div className={styles.cardValue}>{data.totalQuantity.toLocaleString()}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>รับเข้าทั้งหมด</div>
          <div className={styles.cardValue}>{data.totalReceived.toLocaleString()}</div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>เบิกจ่ายทั้งหมด</div>
          <div className={styles.cardValue}>{data.totalDispensed.toLocaleString()}</div>
        </div>
      </div>

      {/* แจ้งเตือน */}
      {(data.alerts.lowStock > 0 || data.alerts.outOfStock > 0) && (
        <div className={styles.alerts}>
          {data.alerts.outOfStock > 0 && (
            <div className={styles.alertCritical}>
              ⚠️ สินค้าหมดแล้ว {data.alerts.outOfStock} รายการ
            </div>
          )}
          {data.alerts.lowStock > 0 && (
            <div className={styles.alertWarning}>
              🔔 สินค้าใกล้หมด {data.alerts.lowStock} รายการ
            </div>
          )}
        </div>
      )}

      {/* แยกตามหมวด */}
      <div className={styles.categorySection}>
        <h2>แยกตามหมวดสินค้า</h2>
        <div className={styles.categoryGrid}>
          {Object.entries(data.byCategory).map(([key, value]) => (
            <div key={key} className={styles.categoryCard}>
              <div className={styles.categoryName}>{categoryLabels[key]}</div>
              <div className={styles.categoryStats}>
                <div>
                  <span className={styles.statLabel}>รายการ:</span>
                  <span className={styles.statValue}>{value.items}</span>
                </div>
                <div>
                  <span className={styles.statLabel}>จำนวน:</span>
                  <span className={styles.statValue}>{value.quantity.toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}