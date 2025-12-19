
'use client';

import { useState, useEffect } from 'react';
import styles from './ShelterStatus.module.css';

interface ShelterSummary {
  shelterName: string;
  status: 'normal' | 'tight' | 'critical';
  alerts: number;
}

export default function ShelterStatus() {
  const [shelters, setShelters] = useState<ShelterSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ใช้ public API ที่ไม่เปิดเผยรายละเอียด แค่แสดงสถานะทั่วไป
        const res = await fetch('/api/stock/public/overview');
        if (res.ok) {
          // ในระบบจริงควรมี API แยกสำหรับ public shelter status
          // ที่ไม่เปิดเผยข้อมูลละเอียด
          setShelters([]);
        }
      } catch (err) {
        console.error('Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return null;
  if (shelters.length === 0) {
    return (
      <div className={styles.container}>
        <h2>สถานะศูนย์พักพิง</h2>
        <div className={styles.placeholder}>
          <p>ข้อมูลสถานะศูนย์พักพิงจะแสดงเฉพาะผู้มีสิทธิ์</p>
          <p className={styles.note}>
            เข้าสู่ระบบเพื่อดูรายละเอียด
          </p>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    normal: styles.normal,
    tight: styles.tight,
    critical: styles.critical
  };

  const statusLabels: Record<string, string> = {
    normal: 'ปกติ',
    tight: 'เริ่มตึง',
    critical: 'วิกฤต'
  };

  return (
    <div className={styles.container}>
      <h2>สถานะศูนย์พักพิง</h2>

      <div className={styles.summary}>
        <div className={styles.summaryItem}>
          <span className={styles.count}>
            {shelters.filter(s => s.status === 'normal').length}
          </span>
          <span className={styles.label}>ปกติ</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.count}>
            {shelters.filter(s => s.status === 'tight').length}
          </span>
          <span className={styles.label}>เริ่มตึง</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.count}>
            {shelters.filter(s => s.status === 'critical').length}
          </span>
          <span className={styles.label}>วิกฤต</span>
        </div>
      </div>

      <div className={styles.shelterList}>
        {shelters.map((shelter, idx) => (
          <div key={idx} className={styles.shelterCard}>
            <div className={styles.shelterName}>{shelter.shelterName}</div>
            <div className={`${styles.status} ${statusColors[shelter.status]}`}>
              {statusLabels[shelter.status]}
            </div>
            {shelter.alerts > 0 && (
              <div className={styles.alertBadge}>
                {shelter.alerts} รายการต้องการความช่วยเหลือ
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}