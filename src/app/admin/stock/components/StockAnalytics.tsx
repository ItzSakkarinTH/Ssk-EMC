'use client';

import { useState, useEffect } from 'react';
import styles from './StockAnalytics.module.css';

interface AnalyticsData {
  turnoverRate: number;
  avgDaysInStock: number;
  topReceived: Array<{ name: string; quantity: number }>;
  topDispensed: Array<{ name: string; quantity: number }>;
  categoryDistribution: Record<string, number>;
}

export default function StockAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7days');

  useEffect(() => {
    fetchData();
  }, [period]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/analytics?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>กำลังโหลด...</div>;
  if (!data) return <div>ไม่มีข้อมูล</div>;

  return (
    <div className={styles.container}>
      <div className={styles.controls}>
        <select value={period} onChange={(e) => setPeriod(e.target.value)}>
          <option value="7days">7 วันล่าสุด</option>
          <option value="30days">30 วันล่าสุด</option>
          <option value="90days">90 วันล่าสุด</option>
        </select>
      </div>

      <div className={styles.metrics}>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>อัตราการหมุนเวียน</div>
          <div className={styles.metricValue}>{data.turnoverRate.toFixed(2)}</div>
        </div>
        <div className={styles.metricCard}>
          <div className={styles.metricLabel}>ค่าเฉลี่ยวันที่อยู่ในสต๊อก</div>
          <div className={styles.metricValue}>{data.avgDaysInStock.toFixed(0)} วัน</div>
        </div>
      </div>

      <div className={styles.section}>
        <h3>รับเข้ามากที่สุด (Top 5)</h3>
        <div className={styles.list}>
          {data.topReceived.map((item, idx) => (
            <div key={idx} className={styles.listItem}>
              <span>{item.name}</span>
              <span>{item.quantity.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3>เบิกจ่ายมากที่สุด (Top 5)</h3>
        <div className={styles.list}>
          {data.topDispensed.map((item, idx) => (
            <div key={idx} className={styles.listItem}>
              <span>{item.name}</span>
              <span>{item.quantity.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}