
'use client';

import { useState, useEffect } from 'react';
import {
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  Layers,
  AlertCircle,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
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
    const fetchOverview = async () => {
      try {
        const res = await fetch('/api/stock/public/overview');
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

    fetchOverview();
    const interval = setInterval(fetchOverview, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return (
    <div className={styles.loadingState}>
      <RefreshCw className={styles.spinner} />
      <span>กำลังวิเคราะห์ข้อมูลเสิร์ฟ...</span>
    </div>
  );

  if (error) return <div className={styles.error}>เกิดข้อผิดพลาด: {error}</div>;
  if (!data) return null;

  return (
    <div className={styles.overviewContainer}>
      <div className={styles.summaryGrid}>
        {/* Main Stats Card */}
        <div className={`${styles.card} ${styles.primaryCard}`}>
          <div className={styles.cardHeader}>
            <div className={styles.iconWrapper}>
              <Layers size={24} />
            </div>
            <span className={styles.cardTitle}>คลังสินค้าส่วนกลาง</span>
          </div>
          <div className={styles.cardBody}>
            <div className={styles.mainValue}>
              {data.totalQuantity.toLocaleString()}
              <span className={styles.unit}>ยูนิต</span>
            </div>
            <div className={styles.subInfo}>
              <Package size={14} />
              <span>{data.totalItems} รายการอุปกรณ์</span>
            </div>
          </div>
          <div className={styles.cardFooter}>
            <div className={styles.progressTrack}>
              <div className={styles.progressBar} style={{ width: '85%' }}></div>
            </div>
            <span className={styles.progressLabel}>ความพร้อมการเติมเสบียง 85%</span>
          </div>
        </div>

        {/* Secondary Stats Group */}
        <div className={styles.metricsGrid}>
          <div className={`${styles.metricCard} ${styles.receivedCard}`}>
            <div className={styles.metricIcon}>
              <ArrowDownToLine size={20} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricLabel}>รับเข้าสะสม</div>
              <div className={styles.metricValue}>+{data.totalReceived.toLocaleString()}</div>
            </div>
          </div>

          <div className={`${styles.metricCard} ${styles.dispensedCard}`}>
            <div className={styles.metricIcon}>
              <ArrowUpFromLine size={20} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricLabel}>เบิกจ่ายสะสม</div>
              <div className={styles.metricValue}>-{data.totalDispensed.toLocaleString()}</div>
            </div>
          </div>

          <div className={`${styles.metricCard} ${styles.statusCard}`}>
            <div className={styles.metricIcon}>
              <TrendingDown size={20} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricLabel}>อัตราการพร่อง</div>
              <div className={styles.metricValue}>0.8% / วัน</div>
            </div>
          </div>

          <div className={`${styles.metricCard} ${styles.alertCard} ${data.alerts.outOfStock > 0 ? styles.criticalAlert : ''}`}>
            <div className={styles.metricIcon}>
              <AlertCircle size={20} />
            </div>
            <div className={styles.metricContent}>
              <div className={styles.metricLabel}>รายการวิกฤต</div>
              <div className={styles.metricValue}>{data.alerts.outOfStock + data.alerts.lowStock} รายการ</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
