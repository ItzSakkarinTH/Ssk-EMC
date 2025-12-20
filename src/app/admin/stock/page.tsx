import ProvinceStockOverview from './components/ProvinceStockOverview';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';
import styles from './adminStock.module.css';

export default function AdminStockPage() {
  const quickLinks = [
    { label: 'ดูทุกศูนย์', href: '/admin/stock/all-shelters', icon: '🏢' },
    { label: 'โอนสต๊อก', href: '/admin/stock/transfers', icon: '🔄' },
    { label: 'คำร้อง', href: '/admin/stock/requests', icon: '📋' },
    { label: 'วิเคราะห์', href: '/admin/stock/analytics', icon: '📊' }
  ];

  return (
    <DashboardLayout
      title="จัดการสต๊อกระดับจังหวัด"
      subtitle="ภาพรวมและการจัดการสต๊อกทั้งหมดในระบบ"
    >
      <div className={styles.quickLinks}>
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href} className={styles.linkCard}>
            <span className={styles.linkIcon}>{link.icon}</span>
            <span className={styles.linkLabel}>{link.label}</span>
          </Link>
        ))}
      </div>

      <ProvinceStockOverview />
    </DashboardLayout>
  );
}