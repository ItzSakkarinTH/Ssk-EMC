'use client';

import Link from 'next/link';
import MyShelterStock from './components/MyShelterStock';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './page.module.css';

export default function StaffStockPage() {
  const quickActions = [
    {
      label: 'รับเข้า',
      icon: '📥',
      href: '/staff/stock/receive',
      color: styles.receive
    },
    {
      label: 'เบิกจ่าย',
      icon: '📤',
      href: '/staff/stock/dispense',
      color: styles.dispense
    },
    {
      label: 'ยื่นคำร้อง',
      icon: '📝',
      href: '/staff/stock/request',
      color: styles.request
    },
    {
      label: 'คำร้องของฉัน',
      icon: '📋',
      href: '/staff/stock/my-requests',
      color: styles.myRequests
    },
    {
      label: 'ประวัติ',
      icon: '📊',
      href: '/staff/stock/history',
      color: styles.history
    }
  ];

  return (
    <DashboardLayout
      title="จัดการสต๊อกสินค้า"
      subtitle="ศูนย์พักพิงของคุณ"
    >
      {/* Quick Actions */}
      <div className={styles.quickActions}>
        {quickActions.map(action => (
          <Link
            key={action.label}
            href={action.href}
            className={`${styles.actionCard} ${action.color}`}
          >
            <div className={styles.actionIcon}>{action.icon}</div>
            <div className={styles.actionLabel}>{action.label}</div>
          </Link>
        ))}
      </div>

      {/* Stock List */}
      <MyShelterStock />
    </DashboardLayout>
  );
}