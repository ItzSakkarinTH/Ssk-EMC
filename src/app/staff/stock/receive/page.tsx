'use client';

import { useRouter } from 'next/navigation';
import QuickReceive from '../components/QuickReceive';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

export default function ReceivePage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/staff/stock');
  };

  return (
    <DashboardLayout
      title="รับเข้าสต๊อกสินค้า"
      subtitle="บันทึกรายการสินค้าที่รับเข้าสู่ศูนย์พักพิง"
    >
      <QuickReceive onSuccess={handleSuccess} />
    </DashboardLayout>
  );
}