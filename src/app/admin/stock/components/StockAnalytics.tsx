'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const fetchData = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch(`/api/stock/admin/analytics?period=${period}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (error) {
      console.error('Failed to fetch:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
          ไม่มีข้อมูล
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Period Selector */}
      <div style={{
        marginBottom: '2rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <label style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: '#cbd5e1'
        }}>
          ช่วงเวลา:
        </label>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          style={{
            padding: '0.75rem 2.5rem 0.75rem 1.25rem',
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid rgba(148, 163, 184, 0.15)',
            borderRadius: '12px',
            color: '#f1f5f9',
            fontSize: '0.9375rem',
            cursor: 'pointer'
          }}
        >
          <option value="7days">7 วันล่าสุด</option>
          <option value="30days">30 วันล่าสุด</option>
          <option value="90days">90 วันล่าสุด</option>
        </select>
      </div>

      {/* Metrics Grid */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardPrimary}`}>
          <div className={`${styles.metricIcon} ${styles.metricIconPrimary}`}>
            📊
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>
              {data.turnoverRate.toFixed(2)}
            </div>
            <div className={styles.metricLabel}>อัตราการหมุนเวียน</div>
          </div>
        </div>

        <div className={`${styles.metricCard} ${styles.metricCardSuccess}`}>
          <div className={`${styles.metricIcon} ${styles.metricIconSuccess}`}>
            📅
          </div>
          <div className={styles.metricContent}>
            <div className={styles.metricValue}>
              {data.avgDaysInStock.toFixed(0)}
            </div>
            <div className={styles.metricLabel}>วันเฉลี่ยในสต๊อก</div>
          </div>
        </div>
      </div>

      {/* Trends Section */}
      <div className={styles.trendsSection}>
        <h3 className={styles.trendsTitle}>สินค้ายอดนิยม</h3>

        <div className={styles.trendsList}>
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#f1f5f9',
              marginBottom: '1rem'
            }}>
              รับเข้ามากที่สุด (Top 5)
            </h4>
            {data.topReceived.map((item, idx) => (
              <div key={idx} className={styles.trendItem}>
                <div className={styles.trendInfo}>
                  <div className={styles.trendIcon}>
                    {idx + 1}
                  </div>
                  <div className={styles.trendDetails}>
                    <div className={styles.trendName}>{item.name}</div>
                    <div className={styles.trendDescription}>สินค้ารับเข้า</div>
                  </div>
                </div>
                <div className={styles.trendValue}>
                  {item.quantity.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          <div>
            <h4 style={{
              fontSize: '1.125rem',
              fontWeight: 700,
              color: '#f1f5f9',
              marginBottom: '1rem'
            }}>
              เบิกจ่ายมากที่สุด (Top 5)
            </h4>
            {data.topDispensed.map((item, idx) => (
              <div key={idx} className={styles.trendItem}>
                <div className={styles.trendInfo}>
                  <div className={styles.trendIcon}>
                    {idx + 1}
                  </div>
                  <div className={styles.trendDetails}>
                    <div className={styles.trendName}>{item.name}</div>
                    <div className={styles.trendDescription}>สินค้าเบิกจ่าย</div>
                  </div>
                </div>
                <div className={styles.trendValue}>
                  {item.quantity.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}