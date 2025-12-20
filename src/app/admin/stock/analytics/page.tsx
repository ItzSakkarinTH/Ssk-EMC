'use client';

import StockAnalytics from '../components/StockAnalytics';
import AdminLayout from '@/components/AdminLayout/AdminLayout';

export default function AnalyticsPage() {
  return (
    <AdminLayout
      title="วิเคราะห์ข้อมูลสต๊อก"
      subtitle="สถิติและการวิเคราะห์การเคลื่อนไหวของสต๊อกในระบบ"
    >
      <StockAnalytics />
    </AdminLayout>
  );
}