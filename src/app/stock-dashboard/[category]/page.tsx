
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import styles from './Category.module.css';

interface StockItem {
  itemName: string;
  totalQuantity: number;
  unit: string;
  status: string;
}

const CATEGORIES = {
  food: 'อาหาร',
  medicine: 'ยา',
  clothing: 'เสื้อผ้า',
  other: 'อื่นๆ'
};

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const category = params.category as string;

  const [data, setData] = useState<{ items: StockItem[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!['food', 'medicine', 'clothing', 'other'].includes(category)) {
      router.push('/stock-dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const res = await fetch(`/api/stock/public/by-category?category=${category}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, router]);

  if (loading) return <div className={styles.loading}>กำลังโหลด...</div>;
  if (!data) return <div className={styles.error}>ไม่พบข้อมูล</div>;

  const statusColors: Record<string, string> = {
    sufficient: styles.green,
    low: styles.yellow,
    critical: styles.red,
    outOfStock: styles.gray
  };

  const statusLabels: Record<string, string> = {
    sufficient: 'เพียงพอ',
    low: 'ใกล้หมด',
    critical: 'วิกฤต',
    outOfStock: 'หมด'
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          ← กลับ
        </button>
        <h1>หมวด{CATEGORIES[category as keyof typeof CATEGORIES]}</h1>
      </div>

      <div className={styles.summary}>
        <span>จำนวนรายการทั้งหมด: {data.items.length}</span>
      </div>

      <div className={styles.itemsList}>
        {data.items.map((item, idx) => (
          <div key={idx} className={styles.itemCard}>
            <div className={styles.itemInfo}>
              <div className={styles.itemName}>{item.itemName}</div>
              <div className={styles.itemQty}>
                {item.totalQuantity.toLocaleString()} {item.unit}
              </div>
            </div>
            <div className={`${styles.status} ${statusColors[item.status]}`}>
              {statusLabels[item.status]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}