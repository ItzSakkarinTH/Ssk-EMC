
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './CategoryBreakdown.module.css';

interface CategoryData {
  items: number;
  quantity: number;
}

interface OverviewData {
  byCategory: {
    food: CategoryData;
    medicine: CategoryData;
    clothing: CategoryData;
    other: CategoryData;
  };
}

export default function CategoryBreakdown() {
  const [data, setData] = useState<OverviewData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/stock/public/overview');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch');
      }
    };

    fetchData();
  }, []);

  if (!data) return null;

  const categories = [
    { key: 'food', label: 'อาหาร', icon: '🍚', color: styles.food },
    { key: 'medicine', label: 'ยา', icon: '💊', color: styles.medicine },
    { key: 'clothing', label: 'เสื้อผ้า', icon: '👕', color: styles.clothing },
    { key: 'other', label: 'อื่นๆ', icon: '📦', color: styles.other }
  ];

  return (
    <div className={styles.container}>
      <h2>แยกตามหมวดสินค้า</h2>

      <div className={styles.grid}>
        {categories.map(cat => {
          const categoryData = data.byCategory[cat.key as keyof typeof data.byCategory];

          return (
            <Link
              key={cat.key}
              href={`/stock-dashboard/${cat.key}`}
              className={`${styles.card} ${cat.color}`}
            >
              <div className={styles.icon}>{cat.icon}</div>
              <div className={styles.label}>{cat.label}</div>
              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span className={styles.statValue}>{categoryData.items}</span>
                  <span className={styles.statLabel}>รายการ</span>
                </div>
                <div className={styles.stat}>
                  <span className={styles.statValue}>
                    {categoryData.quantity.toLocaleString()}
                  </span>
                  <span className={styles.statLabel}>จำนวน</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}