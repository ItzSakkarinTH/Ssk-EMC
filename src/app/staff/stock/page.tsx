
'use client';

import { useState } from 'react';
import Link from 'next/link';
import MyShelterStock from './components/MyShelterStock';
import styles from './page.module.css';

export default function StaffStockPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

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
      label: 'ประวัติ', 
      icon: '📊', 
      href: '/staff/stock/history',
      color: styles.history 
    }
  ];

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>จัดการสต๊อกสินค้า</h1>
        <p>ศูนย์พักพิงของคุณ</p>
      </header>

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
      <MyShelterStock key={refreshKey} />
    </div>
  );
}