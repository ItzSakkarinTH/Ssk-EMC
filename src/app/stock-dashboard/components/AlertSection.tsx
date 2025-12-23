'use client';

import { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import styles from './AlertSection.module.css';

interface Alert {
  itemName: string;
  category: string;
  currentStock: number;
  minLevel: number;
  status: 'low' | 'critical' | 'outOfStock';
}

export default function AlertSection() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/stock/public/alerts');
        if (res.ok) {
          const data = await res.json();
          setAlerts(data.alerts);
        }
      } catch {
        console.error('Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return null;

  if (alerts.length === 0) return (
    <div className={styles.emptyState}>
      <div className={styles.checkIcon}>✓</div>
      <p>ระบบปกติ - ไม่มีการแจ้งเตือน</p>
    </div>
  );

  const categoryLabels: Record<string, string> = {
    food: 'อาหาร/น้ำ',
    medicine: 'เวชภัณฑ์',
    clothing: 'เครื่องนุ่งห่ม',
    other: 'เครื่องใช้อื่นๆ'
  };

  return (
    <div className={styles.alertListContainer}>
      <div className={styles.alertScrollArea}>
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className={`${styles.alertItem} ${styles[alert.status]}`}
          >
            <div className={styles.alertIconBox}>
              {alert.status === 'outOfStock' ? <AlertOctagon size={18} /> : <AlertCircle size={18} />}
            </div>

            <div className={styles.alertInfo}>
              <div className={styles.itemName}>
                {alert.itemName}
                <span className={styles.categoryTag}>{categoryLabels[alert.category]}</span>
              </div>
              <div className={styles.statusDescription}>
                {alert.status === 'outOfStock'
                  ? 'สินค้าหมดคลัง (OUT OF STOCK)'
                  : alert.status === 'critical'
                    ? `ระดับวิกฤต: เหลือเพียง ${alert.currentStock} ชิ้น (เกณฑ์ ${alert.minLevel})`
                    : `ระดับต่ำ: เหลือ ${alert.currentStock} ชิ้น (เกณฑ์ ${alert.minLevel})`
                }
              </div>
            </div>

            <div className={styles.actionArea}>
              <ChevronRight size={16} className={styles.chevron} />
            </div>
          </div>
        ))}
      </div>

      <div className={styles.alertFooter}>
        <p>แสดงรายการที่มีสถานะต่ำกว่าเกณฑ์มาตรฐาน</p>
      </div>
    </div>
  );
}
