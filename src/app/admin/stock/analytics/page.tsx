'use client';

import StockAnalytics from '../components/StockAnalytics';
import styles from './analytics.module.css';

export default function AnalyticsPage() {
  return (
    <div className={styles.container}>
      <h1>วิเคราะห์ข้อมูลสต๊อก</h1>
      <StockAnalytics />
    </div>
  );
}