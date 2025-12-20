'use client';

import StockAnalytics from '../components/StockAnalytics';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

export default function AnalyticsPage() {
  return (
    <DashboardLayout
      title="วิเคราะห์ข้อมูลสต๊อก"
      subtitle="สถิติและการวิเคราะห์การเคลื่อนไหวของสต๊อกในระบบ"
    >
      <StockAnalytics />
    </DashboardLayout>
  );
}