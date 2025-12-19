'use client';

import { useState, useEffect } from 'react';
import styles from './ShelterComparison.module.css';

interface Shelter {
  shelterId: string;
  shelterName: string;
  shelterCode: string;
  totalItems: number;
  totalQuantity: number;
  alerts: { low: number; critical: number; total: number };
  status: 'normal' | 'tight' | 'critical';
}

export default function ShelterComparison() {
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'quantity'>('status');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/admin/all-shelters', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setShelters(data.shelters);
      }
    } catch (err) {
      console.error('Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>กำลังโหลด...</div>;

  const sortedShelters = [...shelters].sort((a, b) => {
    if (sortBy === 'name') return a.shelterName.localeCompare(b.shelterName);
    if (sortBy === 'status') {
      const statusOrder = { critical: 0, tight: 1, normal: 2 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return b.totalQuantity - a.totalQuantity;
  });

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
      <div className={styles.controls}>
        <label>เรียงตาม:</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
          <option value="status">สถานะ</option>
          <option value="name">ชื่อ</option>
          <option value="quantity">จำนวนสต๊อก</option>
        </select>
      </div>

      <div className={styles.grid}>
        {sortedShelters.map(shelter => (
          <div key={shelter.shelterId} className={styles.card}>
            <div className={styles.cardHeader}>
              <div>
                <div className={styles.shelterName}>{shelter.shelterName}</div>
                <div className={styles.shelterCode}>{shelter.shelterCode}</div>
              </div>
              <div className={`${styles.status} ${statusColors[shelter.status]}`}>
                {statusLabels[shelter.status]}
              </div>
            </div>

            <div className={styles.stats}>
              <div className={styles.stat}>
                <span className={styles.statValue}>{shelter.totalItems}</span>
                <span className={styles.statLabel}>รายการ</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statValue}>
                  {shelter.totalQuantity.toLocaleString()}
                </span>
                <span className={styles.statLabel}>จำนวน</span>
              </div>
            </div>

            {shelter.alerts.total > 0 && (
              <div className={styles.alerts}>
                {shelter.alerts.critical > 0 && (
                  <span className={styles.alertCritical}>
                    วิกฤต: {shelter.alerts.critical}
                  </span>
                )}
                {shelter.alerts.low > 0 && (
                  <span className={styles.alertLow}>
                    ใกล้หมด: {shelter.alerts.low}
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}