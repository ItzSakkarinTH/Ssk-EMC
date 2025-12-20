'use client';

import { useRouter } from 'next/navigation';
import RequestForm from '../components/RequestForm';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

export default function RequestPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/staff/stock');
  };

  return (
    <DashboardLayout
      title="ยื่นคำร้องขอสินค้า"
      subtitle="ขอรับการสนับสนุนสินค้าเพิ่มเติมจากกองกลางจังหวัด"
    >
      <RequestForm onSuccess={handleSuccess} />
    </DashboardLayout>
  );
}
