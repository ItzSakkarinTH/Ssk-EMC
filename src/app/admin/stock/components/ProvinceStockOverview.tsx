
'use client';

import { useState, useEffect } from 'react';
import styles from './ProvinceStockOverview.module.css';

interface CategoryData {
  provincial: number;
  shelter: number;
  items: number;
}

interface ProvinceData {
  overview: {
    totalProvincialStock: number;
    totalShelterStock: number;
    totalStock: number;
    totalItems: number;
    alerts: {
      low: number;
      outOfStock: number;
    };
  };
  byCategory: {
    food: CategoryData;
    medicine: CategoryData;
    clothing: CategoryData;
    other: CategoryData;
  };
  provincialStock: Array<{
    stockId: string;
    itemName: string;
    category: string;
    quantity: number;
    unit: string;
    status: string;
  }>;
  recentActivity: {
    receive: { count: number; quantity: number };
    transfer: { count: number; quantity: number };
    dispense: { count: number; quantity: number };
  };
}

export default function ProvinceStockOverview() {
  const [data, setData] = useState<ProvinceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/admin/province-stock', {
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

  const categoryLabels: Record<string, string> = {
    food: 'อาหาร',
    medicine: 'ยา',
    clothing: 'เสื้อผ้า',
    other: 'อื่นๆ'
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>ภาพรวมสต๊อกระดับจังหวัด</h1>
        <button onClick={fetchData} className={styles.refreshBtn}>
          🔄 รีเฟรช
        </button>
      </div>

      {/* สรุปภาพรวม */}
      <div className={styles.summaryGrid}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>สต๊อกกองกลางจังหวัด</div>
          <div className={styles.cardValue}>
            {data.overview.totalProvincialStock.toLocaleString()}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>สต๊อกในศูนย์พักพิง</div>
          <div className={styles.cardValue}>
            {data.overview.totalShelterStock.toLocaleString()}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>รวมทั้งหมด</div>
          <div className={styles.cardValue}>
            {data.overview.totalStock.toLocaleString()}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardLabel}>จำนวนรายการ</div>
          <div className={styles.cardValue}>{data.overview.totalItems}</div>
        </div>
      </div>

      {/* แจ้งเตือน */}
      {(data.overview.alerts.low > 0 || data.overview.alerts.outOfStock > 0) && (
        <div className={styles.alerts}>
          {data.overview.alerts.outOfStock > 0 && (
            <div className={styles.alertCritical}>
              ⚠️ สินค้าหมดแล้ว {data.overview.alerts.outOfStock} รายการ
            </div>
          )}
          {data.overview.alerts.low > 0 && (
            <div className={styles.alertWarning}>
              🔔 สินค้าใกล้หมด {data.overview.alerts.low} รายการ
            </div>
          )}
        </div>
      )}

      {/* แยกตามหมวด */}
      <div className={styles.section}>
        <h2>แยกตามหมวดสินค้า</h2>
        <div className={styles.categoryGrid}>
          {Object.entries(data.byCategory).map(([key, value]) => (
            <div key={key} className={styles.categoryCard}>
              <div className={styles.categoryName}>{categoryLabels[key]}</div>
              <div className={styles.categoryStats}>
                <div>
                  <span>จังหวัด:</span>
                  <strong>{value.provincial.toLocaleString()}</strong>
                </div>
                <div>
                  <span>ศูนย์:</span>
                  <strong>{value.shelter.toLocaleString()}</strong>
                </div>
                <div>
                  <span>รายการ:</span>
                  <strong>{value.items}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* กิจกรรม 7 วันล่าสุด */}
      <div className={styles.section}>
        <h2>กิจกรรม 7 วันล่าสุด</h2>
        <div className={styles.activityGrid}>
          <div className={styles.activityCard}>
            <div className={styles.activityType}>รับเข้า</div>
            <div className={styles.activityCount}>{data.recentActivity.receive.count} ครั้ง</div>
            <div className={styles.activityQty}>
              {data.recentActivity.receive.quantity.toLocaleString()} หน่วย
            </div>
          </div>
          <div className={styles.activityCard}>
            <div className={styles.activityType}>โอน</div>
            <div className={styles.activityCount}>{data.recentActivity.transfer.count} ครั้ง</div>
            <div className={styles.activityQty}>
              {data.recentActivity.transfer.quantity.toLocaleString()} หน่วย
            </div>
          </div>
          <div className={styles.activityCard}>
            <div className={styles.activityType}>เบิกจ่าย</div>
            <div className={styles.activityCount}>{data.recentActivity.dispense.count} ครั้ง</div>
            <div className={styles.activityQty}>
              {data.recentActivity.dispense.quantity.toLocaleString()} หน่วย
            </div>
          </div>
        </div>
      </div>

      {/* สต๊อกที่ค้างอยู่ที่จังหวัด */}
      <div className={styles.section}>
        <h2>สต๊อกค้างอยู่ที่จังหวัด (Top 10)</h2>
        <div className={styles.stockTable}>
          {data.provincialStock.slice(0, 10).map(item => (
            <div key={item.stockId} className={styles.stockRow}>
              <div className={styles.stockInfo}>
                <div className={styles.stockName}>{item.itemName}</div>
                <div className={styles.stockCategory}>{categoryLabels[item.category]}</div>
              </div>
              <div className={styles.stockQuantity}>
                {item.quantity.toLocaleString()} {item.unit}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}