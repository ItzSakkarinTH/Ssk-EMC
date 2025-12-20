'use client';

import { useState } from 'react';
import TransferManager from '../components/TransferManager';
import AdminLayout from '@/components/AdminLayout/AdminLayout';

export default function TransfersPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <AdminLayout
      title="โอนสต๊อกระหว่างศูนย์"
      subtitle="จัดการการโอนย้ายสต๊อกระหว่างศูนย์พักพิงต่างๆ"
    >
      <TransferManager
        key={refreshKey}
        onSuccess={() => setRefreshKey(prev => prev + 1)}
      />
    </AdminLayout>
  );
}