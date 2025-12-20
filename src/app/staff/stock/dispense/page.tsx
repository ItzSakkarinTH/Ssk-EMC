'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QuickDispense from '../components/QuickDispense';
import DashboardLayout from '@/components/DashboardLayout/DashboardLayout';

export default function DispensePage() {
  const router = useRouter();
  const [shelterStock, setShelterStock] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await fetch('/api/stock/staff/my-shelter', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setShelterStock(data.stock);
      }
    } catch (err) {
      console.error('Failed to fetch stock', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    router.push('/staff/stock');
  };

  if (loading) return <div>กำลังโหลด...</div>;

  return (
    <DashboardLayout
      title="เบิกจ่ายสินค้า"
      subtitle="บันทึกการเบิกจ่ายสินค้าออกจากสต๊อกของศูนย์"
    >
      <QuickDispense shelterStock={shelterStock} onSuccess={handleSuccess} />
    </DashboardLayout>
  );
}