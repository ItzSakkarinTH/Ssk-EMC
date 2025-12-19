// src/app/stock-dashboard/page.tsx
import StockOverview from './components/StockOverview';
import CategoryBreakdown from './components/CategoryBreakdown';
import AlertSection from './components/AlertSection';
import ShelterStatus from './components/ShelterStatus';
import styles from './page.module.css';

export const metadata = {
  title: 'Stock Dashboard - Sisaket EMS',
  description: 'ภาพรวมสต๊อกสินค้าระดับจังหวัด'
};

export default function StockDashboardPage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Dashboard สต๊อกสินค้า</h1>
        <p>ระบบจัดการผู้ประสบภัย - จังหวัดศรีสะเกษ</p>
      </header>

      <div className={styles.layout}>
        {/* ภาพรวมหลัก */}
        <StockOverview />

        {/* แจ้งเตือน */}
        <AlertSection />

        {/* แยกตามหมวด */}
        <CategoryBreakdown />

        {/* สถานะศูนย์พักพิง */}
        <ShelterStatus />
      </div>
    </div>
  );
}