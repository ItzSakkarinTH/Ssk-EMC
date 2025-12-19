
'use client';

import { useState, useEffect } from 'react';
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
      } catch (err) {
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
  if (alerts.length === 0) return null;

  const categoryLabels: Record<string, string> = {
    food: 'อาหาร',
    medicine: 'ยา',
    clothing: 'เสื้อผ้า',
    other: 'อื่นๆ'
  };

  const criticalAlerts = alerts.filter(a => a.status === 'critical' || a.status === 'outOfStock');
  const lowAlerts = alerts.filter(a => a.status === 'low');

  return (
    <div className={styles.container}>
      <h2>🔔 แจ้งเตือน</h2>

      {criticalAlerts.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.criticalTitle}>⚠️ วิกฤต/หมดแล้ว ({criticalAlerts.length})</h3>
          <div className={styles.alertList}>
            {criticalAlerts.map((alert, idx) => (
              <div key={idx} className={styles.criticalAlert}>
                <div className={styles.alertName}>
                  {alert.itemName}
                  <span className={styles.category}>
                    ({categoryLabels[alert.category]})
                  </span>
                </div>
                <div className={styles.alertStock}>
                  {alert.status === 'outOfStock'
                    ? 'หมดแล้ว'
                    : `เหลือ ${alert.currentStock} (ต่ำกว่า ${alert.minLevel})`
                  }
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowAlerts.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.lowTitle}>⚠️ ใกล้หมด ({lowAlerts.length})</h3>
          <div className={styles.alertList}>
            {lowAlerts.map((alert, idx) => (
              <div key={idx} className={styles.lowAlert}>
                <div className={styles.alertName}>
                  {alert.itemName}
                  <span className={styles.category}>
                    ({categoryLabels[alert.category]})
                  </span>
                </div>
                <div className={styles.alertStock}>
                  เหลือ {alert.currentStock} (ควรมี {alert.minLevel})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}