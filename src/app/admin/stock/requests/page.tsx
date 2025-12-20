'use client';

import RequestApproval from '../components/RequestApproval';
import AdminLayout from '@/components/AdminLayout/AdminLayout';

export default function RequestsPage() {
  return (
    <AdminLayout
      title="คำร้องขอสินค้า"
      subtitle="พิจารณาและอนุมัติคำร้องขอสินค้าจากศูนย์พักพิงต่างๆ"
    >
      <RequestApproval />
    </AdminLayout>
  );
}