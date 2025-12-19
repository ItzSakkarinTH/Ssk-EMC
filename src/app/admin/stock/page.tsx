import ProvinceStockOverview from './components/ProvinceStockOverview';
import Link from 'next/link';
import styles from './page.module.css';

export default function AdminStockPage() {
  const quickLinks = [
    { label: 'ดูทุกศูนย์', href: '/admin/stock/all-shelters', icon: '🏢' },
    { label: 'โอนสต๊อก', href: '/admin/stock/transfers', icon: '🔄' },
    { label: 'คำร้อง', href: '/admin/stock/requests', icon: '📋' },
    { label: 'วิเคราะห์', href: '/admin/stock/analytics', icon: '📊' }
  ];

  return (
    <div className={styles.container}>
      <h1>จัดการสต๊อกระดับจังหวัด</h1>
      
      <div className={styles.quickLinks}>
        {quickLinks.map(link => (
          <Link key={link.href} href={link.href} className={styles.linkCard}>
            <span className={styles.linkIcon}>{link.icon}</span>
            <span className={styles.linkLabel}>{link.label}</span>
          </Link>
        ))}
      </div>

      <ProvinceStockOverview />
    </div>
  );
}