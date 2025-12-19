'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

interface RequestItem {
  stockId: string;
  itemName: string;
  requestedQuantity: number;
  unit: string;
  reason: string;
}

interface StockRequest {
  _id: string;
  requestNumber: string;
  shelterId?: {
    _id: string;
    name: string;
  };
  requestedBy: {
    _id: string;
    name: string;
  };
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected' | 'partial';
  items: RequestItem[];
  reviewedBy?: {
    _id: string;
    name: string;
  };
  reviewedAt?: string;
  adminNotes?: string;
  deliveryStatus?: string;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<StockRequest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const res = await fetch(`/api/stock/admin/requests/${params.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setRequest(data);
        }
      } catch (err) {
        console.error('Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [params.id]);

  if (loading) return <div>กำลังโหลด...</div>;
  if (!request) return <div>ไม่พบคำร้อง</div>;

  return (
    <div className={styles.container}>
      <button onClick={() => router.back()} className={styles.backBtn}>
        ← กลับ
      </button>

      <h1>คำร้อง: {request.requestNumber}</h1>

      <div className={styles.detail}>
        <div>ศูนย์: {request.shelterId?.name}</div>
        <div>สถานะ: {request.status}</div>
        <div>วันที่: {new Date(request.requestedAt).toLocaleString('th-TH')}</div>
      </div>

      <h2>รายการสินค้า</h2>
      {request.items.map((item: RequestItem, idx: number) => (
        <div key={idx} className={styles.item}>
          <div>{item.itemName}</div>
          <div>{item.requestedQuantity} {item.unit}</div>
          <div>{item.reason}</div>
        </div>
      ))}
    </div>
  );
}