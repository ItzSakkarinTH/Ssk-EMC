'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './page.module.css';

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequest();
  }, []);

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
      {request.items.map((item: any, idx: number) => (
        <div key={idx} className={styles.item}>
          <div>{item.itemName}</div>
          <div>{item.requestedQuantity} {item.unit}</div>
          <div>{item.reason}</div>
        </div>
      ))}
    </div>
  );
}