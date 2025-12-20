'use client';

import RequestApproval from '../components/RequestApproval';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

export default function RequestsPage() {
  return (
    <DashboardLayout
      title="คำร้องขอสินค้า"
      subtitle="พิจารณาและอนุมัติคำร้องขอสินค้าจากศูนย์พักพิงต่างๆ"
    >
      <RequestApproval />
    </DashboardLayout>
  );
}