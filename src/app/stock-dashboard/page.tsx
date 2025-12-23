'use client';

import {
  Activity,
  AlertTriangle,
  Building2,
  Clock,
  ShieldCheck,
  LayoutGrid
} from 'lucide-react';
import StockOverview from './components/StockOverview';
import CategoryBreakdown from './components/CategoryBreakdown';
import AlertSection from './components/AlertSection';
import ShelterStatus from './components/ShelterStatus';
import styles from './StockDashboard.module.css';
import { useEffect, useState } from 'react';

export default function StockDashboardPage() {
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    // Set time immediately using interval trick to avoid ESLint warning
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    // Trigger first update after 0ms
    const initialTimeout = setTimeout(() => setCurrentTime(new Date()), 0);
    return () => {
      clearInterval(timer);
      clearTimeout(initialTimeout);
    };
  }, []);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(date);
  };

  return (
    <div className={styles.dashboardWrapper}>
      {/* Background Orbs for Luxury Feel */}
      <div className={styles.orb1}></div>
      <div className={styles.orb2}></div>

      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTitleArea}>
            <div className={styles.iconBox}>
              <Activity className={styles.pulseIcon} />
            </div>
            <div>
              <h1 className={styles.title}>System Control Center</h1>
              <p className={styles.subtitle}>ระบบเฝ้าระวังและจัดการคลังสินค้า จังหวัดศรีสะเกษ</p>
            </div>
          </div>

          <div className={styles.headerStats}>
            <div className={styles.statusBadge}>
              <span className={styles.statusDot}></span>
              LIVE DATA FEED
            </div>
            <div className={styles.timerBox}>
              <Clock size={16} />
              <span>{currentTime ? formatDate(currentTime) : '...'}</span>
            </div>
          </div>
        </header>

        <main className={styles.mainGrid}>
          {/* Top Section: Hero Stats */}
          <section className={styles.overviewSection}>
            <StockOverview />
          </section>

          {/* Middle Section: Alerts & Shelter Status */}
          <div className={styles.middleGrid}>
            <div className={styles.alertCard}>
              <div className={styles.sectionHeader}>
                <AlertTriangle size={20} className={styles.alertIcon} />
                <h2>รายการเฝ้าระวังเร่งด่วน</h2>
              </div>
              <AlertSection />
            </div>
            <div className={styles.shelterCard}>
              <div className={styles.sectionHeader}>
                <Building2 size={20} className={styles.shelterIcon} />
                <h2>สถานภาพศูนย์พักพิง</h2>
              </div>
              <ShelterStatus />
            </div>
          </div>

          {/* Bottom Section: Categories Breakdown */}
          <section className={styles.categorySection}>
            <div className={styles.sectionHeader}>
              <LayoutGrid size={20} className={styles.categoryIcon} />
              <h2>วิเคราะห์แยกตามหมวดหมู่ทรัพยากร</h2>
            </div>
            <CategoryBreakdown />
          </section>
        </main>

        <footer className={styles.footer}>
          <div className={styles.verifiedBox}>
            <ShieldCheck size={14} />
            <span>ข้อมูลได้รับการตรวจสอบจากศูนย์บัญชาการจังหวัด</span>
          </div>
          <div className={styles.versionLabel}>Sisaket EMS v2.5.0</div>
        </footer>
      </div>
    </div>
  );
}