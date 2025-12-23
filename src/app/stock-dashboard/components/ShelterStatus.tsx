'use client';

import { useState, useEffect } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Navigation,
  Lock,
  Zap
} from 'lucide-react';
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
        const res = await fetch('/api/stock/public/overview');
        if (res.ok) {
          // Public overview doesn't include shelter names usually, 
          // so we keep it as empty to show the premium placeholder 
          // or we can fetch a specific public list if available.
          setShelters([]);
        }
      } catch {
        console.error('Failed to fetch alerts');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return null;

  if (shelters.length === 0) {
    return (
      <div className={styles.restrictedBoard}>
        <div className={styles.lockIcon}>
          <Lock size={32} />
        </div>
        <h3 className={styles.restrictedTitle}>ข้อมูลระดับความมั่นคง</h3>
        <p className={styles.restrictedText}>
          รายละเอียดความเคลื่อนไหวภายในศูนย์พักพิง
          สงวนสิทธิ์เฉพาะหน่วยงานบริหารและเจ้าหน้าที่จังหวัด
        </p>
        <button className={styles.loginHint}>เข้าสู่ระบบเพื่อตรวจสอบสถานะรายศูนย์</button>
      </div>
    );
  }

  const statusIcons: Record<string, React.ElementType> = {
    normal: CheckCircle2,
    tight: Zap,
    critical: ShieldAlert
  };

  const statusLabels: Record<string, string> = {
    normal: 'ทรัพยากรปกติ',
    tight: 'เริ่มขาดแคลน',
    critical: 'วิกฤตเร่งด่วน'
  };

  return (
    <div className={styles.statusBoardContainer}>
      <div className={styles.summaryStats}>
        <div className={styles.sumBox}>
          <span className={styles.sumVal}>{shelters.filter(s => s.status === 'normal').length}</span>
          <span className={styles.sumLab}>ปกติ</span>
        </div>
        <div className={`${styles.sumBox} ${styles.warn}`}>
          <span className={styles.sumVal}>{shelters.filter(s => s.status === 'tight').length}</span>
          <span className={styles.sumLab}>เฝ้าระวัง</span>
        </div>
        <div className={`${styles.sumBox} ${styles.crit}`}>
          <span className={styles.sumVal}>{shelters.filter(s => s.status === 'critical').length}</span>
          <span className={styles.sumLab}>วิกฤต</span>
        </div>
      </div>

      <div className={styles.shelterGrid}>
        {shelters.map((shelter, idx) => {
          const Icon = statusIcons[shelter.status];
          return (
            <div key={idx} className={`${styles.shelterCard} ${styles[shelter.status]}`}>
              <div className={styles.cardInfo}>
                <div className={styles.sName}>{shelter.shelterName}</div>
                <div className={styles.sStatus}>
                  <Icon size={14} />
                  <span>{statusLabels[shelter.status]}</span>
                </div>
              </div>
              <div className={styles.sNav}>
                <Navigation size={18} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
