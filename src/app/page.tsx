'use client';

import Link from 'next/link';
import Sidebar from '@/components/Sidebar/Sidebar';
import { useAuth } from '@/contexts/AuthContext';
import {
  Building2,
  Home,
  Package,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.container}>
      {/* Sidebar Component */}
      <Sidebar />

      <main className={styles.mainWrapper}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div className={styles.topHeaderContent}>
            <h1 className={styles.title}>ศรีสะเกษพร้อม</h1>
            <p className={styles.subtitle}>
              ระบบบริหารจัดการสภาวะวิกฤติของจังหวัดศรีสะเกษ
            </p>
          </div>
          <div className={styles.topHeaderButtons}>
            <button className={styles.headerBtn}>หน้าหลัก</button>
            {!isAuthenticated && (
              <Link href="/login" className={styles.loginBtn}>เข้าสู่ระบบ</Link>
            )}
          </div>
        </header>

        <section className={styles.heroSection}>
          <div className={styles.quickActions}>
            <Link href="/admin/stock/analytics" className={`${styles.actionCard} ${styles.purple}`}>
              <div className={styles.actionIcon}>
                <Building2 size={32} />
              </div>
              <span className={styles.actionLabel}>ศูนย์อำนวยการ</span>
            </Link>

            <Link href="/stock-dashboard" className={`${styles.actionCard} ${styles.teal}`}>
              <div className={styles.actionIcon}>
                <Home size={32} />
              </div>
              <span className={styles.actionLabel}>ศูนย์พักพิง</span>
            </Link>

            <Link href="/admin/stock/all-shelters" className={`${styles.actionCard} ${styles.pink}`}>
              <div className={styles.actionIcon}>
                <Package size={32} />
              </div>
              <span className={styles.actionLabel}>สิ่งของบริจาค</span>
            </Link>

            <Link href="/admin/stock/requests" className={`${styles.actionCard} ${styles.rose}`}>
              <div className={styles.actionIcon}>
                <AlertCircle size={32} />
              </div>
              <span className={styles.actionLabel}>คำร้องขอความช่วยเหลือ</span>
            </Link>
          </div>
        </section>

        {/* Statistics Cards */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={`${styles.statCard} ${styles.purpleCard}`}>
              <div className={styles.statHeader}>
                <Building2 size={32} />
                <span className={styles.badge}>+12%</span>
              </div>
              <h3 className={styles.statTitle}>ศูนย์อพยพทั้งหมด</h3>
              <p className={styles.statValue}>24</p>
              <p className={styles.statSubtext}>เปิดใช้งาน 18 ศูนย์</p>
            </div>

            <div className={`${styles.statCard} ${styles.tealCard}`}>
              <div className={styles.statHeader}>
                <Home size={32} />
                <span className={styles.badge}>+8%</span>
              </div>
              <h3 className={styles.statTitle}>ศูนย์พักพิงทั้งหมด</h3>
              <p className={styles.statValue}>156</p>
              <p className={styles.statSubtext}>เปิดใช้งาน 142 ศูนย์</p>
            </div>

            <div className={`${styles.statCard} ${styles.pinkCard}`}>
              <div className={styles.statHeader}>
                <AlertCircle size={32} />
                <span className={`${styles.badge} ${styles.badgeRed}`}>+24%</span>
              </div>
              <h3 className={styles.statTitle}>คำร้องด่วนทั้งหมด</h3>
              <p className={styles.statValue}>89</p>
              <p className={styles.statSubtext}>รออนุมัติ 34 รายการ</p>
            </div>

            <div className={`${styles.statCard} ${styles.indigoCard}`}>
              <div className={styles.statHeader}>
                <Package size={32} />
                <TrendingUp size={20} className={styles.trendIcon} />
              </div>
              <h3 className={styles.statTitle}>สิ่งของที่ถูกขอมากที่สุด</h3>
              <div className={styles.tags}>
                <span className={styles.tag}>น้ำดื่ม</span>
                <span className={styles.tag}>ยา</span>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
