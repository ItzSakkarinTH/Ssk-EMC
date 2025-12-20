'use client';

import { useState, useEffect } from 'react';
import styles from './page.module.css';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

interface StockInfo {
  itemName?: string;
}

interface UserInfo {
  name?: string;
}

interface LocationInfo {
  id?: string;
  type?: string;
  name?: string;
}

interface Movement {
  id: string;
  stockId: StockInfo | null;
  movementType: string;
  quantity: number;
  unit: string;
  from: LocationInfo | null;
  to: LocationInfo | null;
  performedBy: UserInfo | null;
  performedAt: string;
  notes: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const url = filter === 'all'
          ? '/api/stock/staff/history'
          : `/api/stock/staff/history?type=${filter}`;

        const res = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setHistory(data.history);
        }
      } catch (err) {
        console.error('Failed to fetch history', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [filter]);

  const typeLabels: Record<string, string> = {
    receive: 'รับเข้า',
    dispense: 'เบิกจ่าย',
    transfer: 'โอน'
  };

  return (
    <DashboardLayout
      title="ประวัติการเคลื่อนไหว"
      subtitle="ตรวจสอบรายการรับเข้า เบิกจ่าย และโอนสินค้าของศูนย์"
    >
      <div className={styles.filters}>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="dash-select">
          <option value="all">ทั้งหมด</option>
          <option value="receive">รับเข้า</option>
          <option value="dispense">เบิกจ่าย</option>
          <option value="transfer">โอน</option>
        </select>
      </div>

      {loading ? (
        <div className="dash-loading">
          <div className="dash-spinner"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      ) : history.length === 0 ? (
        <div className={styles.empty}>ไม่มีประวัติ</div>
      ) : (
        <div className={styles.timeline}>
          {history.map(item => (
            <div key={item.id} className={styles.timelineItem}>
              <div className={styles.timelineDate}>
                {new Date(item.performedAt).toLocaleString('th-TH')}
              </div>
              <div className={styles.timelineContent}>
                <div className={styles.timelineType}>
                  {typeLabels[item.movementType]}
                </div>
                <div className={styles.timelineDetail}>
                  {item.stockId?.itemName} - {item.quantity} {item.unit}
                </div>
                {item.notes && (
                  <div className={styles.timelineNotes}>{item.notes}</div>
                )}
                <div className={styles.timelineUser}>
                  โดย: {item.performedBy?.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}