
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

import { ArrowLeft } from 'lucide-react';

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
      } catch {
        console.error('Failed to fetch');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [category, router]);

  if (loading) return <div className={styles.loading}>กำลังวิเคราะห์หมวดหมู่...</div>;
  if (!data) return <div className={styles.error}>ไม่พบข้อมูล</div>;

  const statusColors: Record<string, string> = {
    sufficient: styles.green,
    low: styles.yellow,
    critical: styles.red,
    outOfStock: styles.gray
  };

  const statusLabels: Record<string, string> = {
    sufficient: 'ทรัพยากรปกติ',
    low: 'เฝ้าระวัง',
    critical: 'วิกฤต',
    outOfStock: 'สินค้าหมด'
  };

  return (
    <div className={styles.categoryContainer}>
      <header className={styles.header}>
        <button onClick={() => router.back()} className={styles.backBtn}>
          <ArrowLeft size={18} />
          <span>ศูนย์กลาง</span>
        </button>
        <h1>Resource: {CATEGORIES[category as keyof typeof CATEGORIES]}</h1>
      </header>

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