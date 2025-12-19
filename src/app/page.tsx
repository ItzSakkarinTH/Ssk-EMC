'use client';

import Link from 'next/link';
import {
  Building2,
  Home,
  Package,
  AlertCircle,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react';
import styles from './page.module.css';

export default function HomePage() {
  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>ศรีสะเกษพร้อม</h1>
          <p className={styles.subtitle}>
            ระบบบริหารจัดการสภาวะวิกฤติของจังหวัดศรีสะเกษ
          </p>

          {/* Quick Action Buttons */}
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
        </div>
      </div>

      {/* Statistics Cards */}
      <div className={styles.statsSection}>
        <div className={styles.statsGrid}>
          {/* Card 1 */}
          <div className={`${styles.statCard} ${styles.purpleCard}`}>
            <div className={styles.statHeader}>
              <Building2 size={32} />
              <span className={styles.badge}>+12%</span>
            </div>
            <h3 className={styles.statTitle}>ศูนย์อพยพทั้งหมด</h3>
            <p className={styles.statValue}>24</p>
            <p className={styles.statSubtext}>เปิดใช้งาน 18 ศูนย์</p>
          </div>

          {/* Card 2 */}
          <div className={`${styles.statCard} ${styles.tealCard}`}>
            <div className={styles.statHeader}>
              <Home size={32} />
              <span className={styles.badge}>+8%</span>
            </div>
            <h3 className={styles.statTitle}>ศูนย์พักพิงทั้งหมด</h3>
            <p className={styles.statValue}>156</p>
            <p className={styles.statSubtext}>เปิดใช้งาน 142 ศูนย์</p>
          </div>

          {/* Card 3 */}
          <div className={`${styles.statCard} ${styles.pinkCard}`}>
            <div className={styles.statHeader}>
              <AlertCircle size={32} />
              <span className={`${styles.badge} ${styles.badgeRed}`}>+24%</span>
            </div>
            <h3 className={styles.statTitle}>คำร้องด่วนทั้งหมด</h3>
            <p className={styles.statValue}>89</p>
            <p className={styles.statSubtext}>รออนุมัติ 34 รายการ</p>
          </div>

          {/* Card 4 */}
          <div className={`${styles.statCard} ${styles.indigoCard}`}>
            <div className={styles.statHeader}>
              <Package size={32} />
              <TrendingUp size={20} className={styles.trendIcon} />
            </div>
            <h3 className={styles.statTitle}>สิ่งของที่ถูกขอมากที่สุด</h3>
            <div className={styles.tags}>
              <span className={styles.tag}>น้ำดื่ม</span>
              <span className={styles.tag}>บะหมี่กึ่งสำเร็จรูป</span>
              <span className={styles.tag}>ยา</span>
            </div>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className={styles.infoGrid}>
          <Link href="/admin/stock/analytics" className={`${styles.infoCard} ${styles.blueInfo}`}>
            <div className={styles.infoIcon}>
              <FileText size={24} />
            </div>
            <div className={styles.infoContent}>
              <h3 className={styles.infoTitle}>รายงานและสถิติ</h3>
              <p className={styles.infoText}>
                ดูข้อมูลสถิติและรายงานการจัดการสภาวะวิกฤติ
              </p>
            </div>
          </Link>

          <Link href="/stock-dashboard" className={`${styles.infoCard} ${styles.emeraldInfo}`}>
            <div className={styles.infoIcon}>
              <Package size={24} />
            </div>
            <div className={styles.infoContent}>
              <h3 className={styles.infoTitle}>คลังสิ่งของ</h3>
              <p className={styles.infoText}>
                จัดการและติดตามสต๊อกสิ่งของบริจาค
              </p>
            </div>
          </Link>

          <Link href="/admin/stock/all-shelters" className={`${styles.infoCard} ${styles.amberInfo}`}>
            <div className={styles.infoIcon}>
              <Users size={24} />
            </div>
            <div className={styles.infoContent}>
              <h3 className={styles.infoTitle}>จัดการศูนย์พักพิง</h3>
              <p className={styles.infoText}>
                ดูและจัดการข้อมูลศูนย์พักพิงทั้งหมด
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
